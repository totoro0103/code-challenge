import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom does not implement scrolling.
Element.prototype.scrollIntoView = () => {};

afterEach(cleanup);
