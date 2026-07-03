import * as z from "zod";
import * as sharedSchemas from "@repo/shared";

type JsonObject = Record<string, unknown>;

export function openApiifyJsonSchema(node: unknown): unknown {
    // If the top-level schema is just a $ref into its own definitions block,
    // inline it so the OpenAPI plugin can iterate properties (path/query params).
    if (
        node &&
        typeof node === "object" &&
        !Array.isArray(node) &&
        typeof (node as JsonObject).$ref === "string" &&
        (node as JsonObject).definitions &&
        typeof (node as JsonObject).definitions === "object"
    ) {
        const obj = node as JsonObject;
        const ref = obj.$ref as string;
        const match = ref.match(/^#\/definitions\/(.+)$/);
        const defs = obj.definitions as JsonObject;
        if (match && defs[match[1]]) {
            return openApiifyJsonSchema(defs[match[1]]);
        }
    }
    if (node && typeof node === "object" && !Array.isArray(node)) {
        const obj = node as JsonObject;
        delete obj.$schema;
        delete obj.definitions;
        delete obj.id;
    }
    return convertToOpenApi30(rewriteRefs(node));
}

function isNullSchema(node: unknown): boolean {
    return (
        !!node &&
        typeof node === "object" &&
        !Array.isArray(node) &&
        (node as JsonObject).type === "null" &&
        Object.keys(node as JsonObject).length === 1
    );
}

function convertToOpenApi30(node: unknown): unknown {
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            node[i] = convertToOpenApi30(node[i]);
        }
        return node;
    }
    if (!node || typeof node !== "object") return node;
    const obj = node as JsonObject;

    for (const key of Object.keys(obj)) {
        obj[key] = convertToOpenApi30(obj[key]);
    }

    rewriteNullable(obj);
    rewriteExclusiveBound(obj, "exclusiveMinimum", "minimum");
    rewriteExclusiveBound(obj, "exclusiveMaximum", "maximum");
    rewriteConst(obj);

    return obj;
}

function rewriteNullable(obj: JsonObject): void {
    if (!Array.isArray(obj.anyOf)) return;

    const variants = obj.anyOf as unknown[];
    const nullIndex = variants.findIndex(isNullSchema);
    if (nullIndex < 0) return;

    const remaining = variants.filter((_, i) => i !== nullIndex);
    obj.nullable = true;

    if (remaining.length !== 1) {
        obj.anyOf = remaining;
        return;
    }

    delete obj.anyOf;
    const nonNull = remaining[0] as JsonObject;
    if (typeof nonNull.$ref === "string") {
        obj.allOf = [{ $ref: nonNull.$ref }];
    } else {
        for (const [k, v] of Object.entries(nonNull)) {
            if (!(k in obj)) obj[k] = v;
        }
    }
}

function rewriteExclusiveBound(
    obj: JsonObject,
    exclusiveKey: "exclusiveMinimum" | "exclusiveMaximum",
    boundKey: "minimum" | "maximum"
): void {
    if (typeof obj[exclusiveKey] !== "number") return;
    if (!(boundKey in obj)) {
        obj[boundKey] = obj[exclusiveKey];
    }
    obj[exclusiveKey] = true;
}

function rewriteConst(obj: JsonObject): void {
    if (!("const" in obj)) return;
    const value = obj.const;
    delete obj.const;
    obj.enum = [value];
}

function rewriteRefs(node: unknown): unknown {
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) node[i] = rewriteRefs(node[i]);
        return node;
    }
    if (!node || typeof node !== "object") return node;
    const obj = node as JsonObject;
    if (typeof obj.$ref === "string") {
        obj.$ref = obj.$ref.replace(
            /^#\/definitions\//,
            "#/components/schemas/"
        );
    }
    for (const key of Object.keys(obj)) {
        obj[key] = rewriteRefs(obj[key]);
    }
    return obj;
}

function collectRefs(node: unknown, into: Set<string>): void {
    if (!node) return;
    if (Array.isArray(node)) {
        node.forEach((n) => collectRefs(n, into));
        return;
    }
    if (typeof node !== "object") return;
    const obj = node as JsonObject;
    if (typeof obj.$ref === "string") {
        const match = obj.$ref.match(/^#\/components\/schemas\/(.+)$/);
        if (match) into.add(match[1]);
    }
    for (const value of Object.values(obj)) collectRefs(value, into);
}

function renderZodSchema(schema: z.ZodType): unknown {
    const json = z.toJSONSchema(schema, {
        target: "draft-7",
        unrepresentable: "any",
        override: (ctx) => {
            if (ctx.zodSchema._zod.def.type === "date") {
                ctx.jsonSchema.type = "string";
                ctx.jsonSchema.format = "date-time";
            }
        },
    });
    return openApiifyJsonSchema(json);
}

function renderSchemaById(id: string): unknown | undefined {
    const exportName = `${id}Schema`;
    const candidate = (sharedSchemas as Record<string, unknown>)[exportName];
    if (!candidate || typeof candidate !== "object" || !("_zod" in candidate)) {
        return undefined;
    }
    return renderZodSchema(candidate as z.ZodType);
}

type RouteLike = {
    method: string;
    path: string;
    hooks?: { body?: unknown; detail?: { hide?: boolean } };
};

/**
 * Restores request-body schemas the openapi plugin drops. The root `.onParse`
 * hook (chunked-body size limit in index.ts) makes every route carry a custom
 * parser, and @elysiajs/openapi renders `content: {}` for bodies whenever it
 * sees one (it only maps *named* parsers to content types). Every body in this
 * API is JSON, so rebuild `application/json` from each route's own body
 * schema: `$ref` for `.model()` names, inline render for direct Zod schemas.
 */
export function repairRequestBodies(
    spec: JsonObject,
    routes: RouteLike[]
): JsonObject {
    const paths = spec.paths as JsonObject | undefined;
    if (!paths) return spec;

    for (const route of routes) {
        const body = route.hooks?.body;
        const method = route.method.toLowerCase();
        if (!body || method === "get" || method === "head") continue;

        const specPath = route.path.replace(/:([^/]+)/g, "{$1}");
        const operation = (paths[specPath] as JsonObject | undefined)?.[
            method
        ] as JsonObject | undefined;
        const requestBody = operation?.requestBody as JsonObject | undefined;
        if (!requestBody) continue;

        const content = requestBody.content as JsonObject | undefined;
        if (content && Object.keys(content).length > 0) continue;

        let schema: unknown;
        if (typeof body === "string") {
            schema = { $ref: `#/components/schemas/${body}` };
        } else if (typeof body === "object" && "_zod" in body) {
            schema = renderZodSchema(body as z.ZodType);
        }
        if (!schema) continue;

        requestBody.content = { "application/json": { schema } };
    }

    return spec;
}

export function fillMissingComponentSchemas(spec: JsonObject): JsonObject {
    const components = (spec.components ??= {} as JsonObject) as JsonObject;
    const schemas = (components.schemas ??= {} as JsonObject) as JsonObject;

    while (true) {
        const refs = new Set<string>();
        collectRefs(spec, refs);
        const missing = [...refs].filter((id) => !(id in schemas));
        if (missing.length === 0) break;

        let added = 0;
        for (const id of missing) {
            const rendered = renderSchemaById(id);
            if (rendered === undefined) continue;
            schemas[id] = rendered;
            added++;
        }

        if (added === 0) {
            console.warn(
                `[openapi] could not resolve schemas: ${missing.join(", ")}`
            );
            break;
        }
    }

    return spec;
}
