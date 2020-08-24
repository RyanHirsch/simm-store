import { produce, Draft } from "immer";
import * as stringify from "json-stable-stringify";

type SubscriptionCallback<T> = (newVal: T, oldVal: T) => void;
type UpdateValue<T> = Partial<T> | ((draft: Draft<T>) => void);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stableKey(key: any): string {
  return typeof key === "string" ? key : stringify(key);
}

export class BaseStore<ValueT> {
  private subscriptions: Map<string, Array<SubscriptionCallback<ValueT>>> = new Map();

  private internalValue: ValueT;

  constructor(initialValue: ValueT) {
    this.internalValue = initialValue;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(subscriptionCb: SubscriptionCallback<ValueT>, key: any = ""): () => void {
    const consistentKey = stableKey(key);
    if (!this.subscriptions.has(consistentKey)) {
      this.subscriptions.set(consistentKey, []);
    }
    const listeners = this.subscriptions.get(consistentKey);
    listeners.push(subscriptionCb);

    return () => this.unsubscribe(subscriptionCb, consistentKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsubscribe(subscriptionCb: SubscriptionCallback<ValueT>, key: any = ""): void {
    const consistentKey = stableKey(key);

    const listeners = this.subscriptions.get(consistentKey);
    const foundSubscriberIndex = listeners.indexOf(subscriptionCb);

    if (foundSubscriberIndex > -1) {
      listeners.splice(foundSubscriberIndex, 1);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(value?: UpdateValue<ValueT>, key: any = ""): void {
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
      ) as ValueT;

      if (this.internalValue !== existingValue) {
        (this.subscriptions.get(consistentKey) ?? []).forEach((cb) =>
          cb(this.internalValue, existingValue)
        );
      }
    }
  }

  public get value(): ValueT {
    return this.internalValue;
  }
}
