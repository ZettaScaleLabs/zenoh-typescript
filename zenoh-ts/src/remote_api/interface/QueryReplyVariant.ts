// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { OwnedKeyExprWrapper } from "./OwnedKeyExprWrapper";

export type QueryReplyVariant = { "Reply": { key_expr: OwnedKeyExprWrapper, payload: Array<number>, } } | { "ReplyErr": { payload: Array<number>, } } | { "ReplyDelete": { key_expr: OwnedKeyExprWrapper, } };
