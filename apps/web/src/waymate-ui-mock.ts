// CI stub for @waymate/ui — minimal functional components when the real package
// is not installed. Tests render with these no-op implementations.
import { createElement, type ReactNode } from "react";

type AnyProps = {
    children?: ReactNode;
    onClick?: () => void;
    open?: boolean;
    [key: string]: unknown;
};

export const Button = ({ children, onClick }: AnyProps) =>
    createElement("button", { type: "button", onClick }, children);

export const Modal = ({ children, open }: AnyProps) =>
    open ? createElement("div", null, children) : null;

export const Avatar = () => null;
export const NavButton = ({ children, onClick, icon }: AnyProps) =>
    createElement(
        "button",
        { type: "button", onClick },
        icon as ReactNode,
        children
    );
export const ChevronDownIcon = () => null;
