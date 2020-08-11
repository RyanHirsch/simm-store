import { produce, Draft } from "immer";
import * as stringify from "json-stable-stringify";

type SubscriptionCallback<T> = (newVal: T, oldVal: T) => void;
type UpdateValue<T> = Partial<T> | ((draft: Draft<T>) => void);

function stableKey(key: any): string {
  return typeof key === "string" ? key : stringify(key);
}

export class BaseStore<Value> {
  private subscriptions: Map<
    string,
    Array<SubscriptionCallback<Value>>
  > = new Map();
  private _value: Value;

  constructor(initialValue: Value) {
    this._value = initialValue;
  }

  subscribe(subscriptionCb: SubscriptionCallback<Value>, key: any = "") {
    const consistentKey = stableKey(key);
    if (!this.subscriptions.has(consistentKey)) {
      this.subscriptions.set(consistentKey, []);
    }
    const listeners = this.subscriptions.get(consistentKey);
    listeners.push(subscriptionCb);

    return () => this.unsubscribe(subscriptionCb, consistentKey);
  }

  unsubscribe(subscriptionCb: SubscriptionCallback<Value>, key: any = "") {
    const consistentKey = stableKey(key);

    const listeners = this.subscriptions.get(consistentKey);
    const foundSubscriberIndex = listeners.indexOf(subscriptionCb);

    if (foundSubscriberIndex > -1) {
      listeners.splice(foundSubscriberIndex, 1);
    }
  }

  update(value?: UpdateValue<Value>, key: any = "") {
    const consistentKey = stableKey(key);

    const existingValue = this._value;
    if (value) {
      this._value = produce(
        this._value,
        typeof value === `function`
          ? value
          : (draft) => {
              Object.assign(draft, value);
            }
      ) as Value;

      if (this._value !== existingValue) {
        (this.subscriptions.get(consistentKey) ?? []).forEach((cb) =>
          cb(this._value, existingValue)
        );
      }
    }
  }

  public get value() {
    return this._value;
  }
}
