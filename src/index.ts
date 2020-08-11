import { produce, Draft } from "immer";
import * as stringify from "json-stable-stringify";

type SubscriptionCallback<T> = (newVal: T, oldVal: T) => void;
type UpdateValue<T> = Partial<T> | ((draft: Draft<T>) => void);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stableKey(key: any): string {
  return typeof key === "string" ? key : stringify(key);
}

export class BaseStore<Value> {
  private subscriptions: Map<string, Array<SubscriptionCallback<Value>>> = new Map();

  private internalValue: Value;

  constructor(initialValue: Value) {
    this.internalValue = initialValue;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(subscriptionCb: SubscriptionCallback<Value>, key: any = ""): () => void {
    const consistentKey = stableKey(key);
    if (!this.subscriptions.has(consistentKey)) {
      this.subscriptions.set(consistentKey, []);
    }
    const listeners = this.subscriptions.get(consistentKey);
    listeners.push(subscriptionCb);

    return () => this.unsubscribe(subscriptionCb, consistentKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsubscribe(subscriptionCb: SubscriptionCallback<Value>, key: any = ""): void {
    const consistentKey = stableKey(key);

    const listeners = this.subscriptions.get(consistentKey);
    const foundSubscriberIndex = listeners.indexOf(subscriptionCb);

    if (foundSubscriberIndex > -1) {
      listeners.splice(foundSubscriberIndex, 1);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(value?: UpdateValue<Value>, key: any = ""): void {
    const consistentKey = stableKey(key);

    const existingValue = this.internalValue;
    if (value) {
      this.internalValue = produce(
        this.internalValue,
        typeof value === `function`
          ? value
          : (draft) => {
              Object.assign(draft, value);
            }
      ) as Value;

      if (this.internalValue !== existingValue) {
        (this.subscriptions.get(consistentKey) ?? []).forEach((cb) =>
          cb(this.internalValue, existingValue)
        );
      }
    }
  }

  public get value(): Value {
    return this.internalValue;
  }
}
