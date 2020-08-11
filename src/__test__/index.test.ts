import { BaseStore } from "../index";

describe("BaseStore", () => {
  it("sets initial value", () => {
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    expect(myStore.value).toHaveProperty("name", "jane");
  });

  it("allows updates with no subscribers", () => {
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });

    myStore.update((d) => {
      d.name = "bob";
    });
  });

  it("notifies on change", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    myStore.subscribe(mockCallback);

    myStore.update({ name: "bob" });
    expect(myStore.value).toHaveProperty("name", "bob");

    myStore.update({ name: "jane" });
    expect(myStore.value).toHaveProperty("name", "jane");

    expect(mockCallback.mock.calls.length).toBe(2);
    expect(mockCallback.mock.calls[0][0]).toHaveProperty("name", "bob");
    expect(mockCallback.mock.calls[0][1]).toHaveProperty("name", "jane");

    expect(mockCallback.mock.calls[1][0]).toHaveProperty("name", "jane");
    expect(mockCallback.mock.calls[1][1]).toHaveProperty("name", "bob");
  });

  it("unsubscribes and stops notifications on change (via subscribe return)", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    const unsubscribe = myStore.subscribe(mockCallback);

    myStore.update({ name: "bob" });
    expect(mockCallback.mock.calls.length).toBe(1);
    unsubscribe();

    myStore.update({ name: "jane" });
    expect(mockCallback.mock.calls.length).toBe(1);
  });

  it("unsubscribes and stops notifications on change (via .unsubscribe)", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    myStore.subscribe(mockCallback);

    myStore.update({ name: "bob" });
    expect(mockCallback.mock.calls.length).toBe(1);
    myStore.unsubscribe(mockCallback);

    myStore.update({ name: "jane" });
    expect(mockCallback.mock.calls.length).toBe(1);
  });

  it("supports a mutation method", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    myStore.subscribe(mockCallback);

    myStore.update((d) => {
      d.name = "bob";
    });
    expect(myStore.value).toHaveProperty("name", "bob");
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toHaveProperty("name", "bob");
    expect(mockCallback.mock.calls[0][1]).toHaveProperty("name", "jane");
  });

  it("does not notify subscribers on noop updates", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    myStore.subscribe(mockCallback);
    expect(mockCallback.mock.calls.length).toBe(0);

    myStore.update((_d) => {});
    expect(mockCallback.mock.calls.length).toBe(0);
  });

  it("does not notify subscribers on empty object updates", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    myStore.subscribe(mockCallback);
    expect(mockCallback.mock.calls.length).toBe(0);

    myStore.update({});
    expect(mockCallback.mock.calls.length).toBe(0);
  });

  it("does not notify subscribers on same value updates", () => {
    const mockCallback = jest.fn();
    const myStore = new BaseStore<{ name: string }>({ name: "jane" });
    myStore.subscribe(mockCallback);

    myStore.update((d) => {
      d.name = "jane";
    });
    myStore.update({ name: "jane" });

    expect(mockCallback.mock.calls.length).toBe(0);
  });

  it("calls the subscribe function and can leverage structural sharing", () => {
    let subscribeCallCount = 0;
    const myStore = new BaseStore<{ name: string; nested: any }>({
      name: "jane",
      nested: { value: "yeah!" },
    });
    myStore.subscribe((newVal, oldVal) => {
      subscribeCallCount++;
      expect(newVal.nested).toEqual(oldVal.nested);
    });

    myStore.update((d) => {
      d.name = "james";
    });
    myStore.update({ name: "john" });

    expect(subscribeCallCount).toBe(2);
  });
});
