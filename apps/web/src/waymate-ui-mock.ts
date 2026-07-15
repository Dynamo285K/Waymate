// CI stub for @waymate/ui — returns no-op components when the real package
// is not installed. Tests that import @waymate/ui components will render null.
import { createElement, type ReactNode } from "react";

const noop = () => null;
const passChildren = ({ children }: { children?: ReactNode }) =>
    createElement("div", null, children);

export const Button = noop;
export const Modal = passChildren;
export const Avatar = noop;
export const NavButton = noop;
export const ChevronDownIcon = noop;
