import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip>hello</Chip>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
