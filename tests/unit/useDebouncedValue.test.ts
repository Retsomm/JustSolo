import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("延遲時間內連續變化，只有最後一次值會在延遲後生效", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } },
    );

    expect(result.current).toBe("a");

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "abc" });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("abc");
  });

  it("超過延遲時間沒有再變化，值會更新成最新的", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "台中" } },
    );

    rerender({ value: "台中燒肉" });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("台中燒肉");
  });
});
