// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { OwnedKeyExprWrapper } from "./OwnedKeyExprWrapper";
import type { SampleWS } from "./SampleWS";

export type DataMsg = { "Sample": [SampleWS, string] } | { "PublisherPut": [Array<number>, string] } | { "Put": { key_expr: OwnedKeyExprWrapper, payload: Array<number>, } } | { "Delete": { key_expr: OwnedKeyExprWrapper, } };
