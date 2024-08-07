
export type IntoEncoding = Encoding | String | string;

export class Encoding {
    private _schema: string;

    private constructor(str_rep: string) {
        this._schema = str_rep;
    }

    static into_Encoding(input: IntoEncoding): Encoding {
        if (input instanceof Encoding) {
            return input
        } else {
            return new Encoding(input.toString())
        }
    }

    static default(): Encoding {
        return new Encoding(encoding.ZENOH_BYTES);
    }

    toString(): string {
        return this._schema
    }
    static from_str(input: string): Encoding {
        return new Encoding(input);
    }

    // Enum Variants
    static ZENOH_BYTES(): Encoding {
        return new Encoding(encoding.ZENOH_BYTES)
    }
    static ZENOH_INT8(): Encoding {
        return new Encoding(encoding.ZENOH_INT8)
    }
    static ZENOH_INT16(): Encoding {
        return new Encoding(encoding.ZENOH_INT16)
    }
    static ZENOH_INT32(): Encoding {
        return new Encoding(encoding.ZENOH_INT32)
    }
    static ZENOH_INT64(): Encoding {
        return new Encoding(encoding.ZENOH_INT64)
    }
    static ZENOH_INT128(): Encoding {
        return new Encoding(encoding.ZENOH_INT128)
    }
    static ZENOH_UINT8(): Encoding {
        return new Encoding(encoding.ZENOH_UINT8)
    }
    static ZENOH_UINT16(): Encoding {
        return new Encoding(encoding.ZENOH_UINT16)
    }
    static ZENOH_UINT32(): Encoding {
        return new Encoding(encoding.ZENOH_UINT32)
    }
    static ZENOH_UINT64(): Encoding {
        return new Encoding(encoding.ZENOH_UINT64)
    }
    static ZENOH_UINT128(): Encoding {
        return new Encoding(encoding.ZENOH_UINT128)
    }
    static ZENOH_FLOAT32(): Encoding {
        return new Encoding(encoding.ZENOH_FLOAT32)
    }
    static ZENOH_FLOAT64(): Encoding {
        return new Encoding(encoding.ZENOH_FLOAT64)
    }
    static ZENOH_BOOL(): Encoding {
        return new Encoding(encoding.ZENOH_BOOL)
    }
    static ZENOH_STRING(): Encoding {
        return new Encoding(encoding.ZENOH_STRING)
    }
    static ZENOH_ERROR(): Encoding {
        return new Encoding(encoding.ZENOH_ERROR)
    }
    static APPLICATION_OCTET_STREAM(): Encoding {
        return new Encoding(encoding.APPLICATION_OCTET_STREAM)
    }
    static TEXT_PLAIN(): Encoding {
        return new Encoding(encoding.TEXT_PLAIN)
    }
    static APPLICATION_JSON(): Encoding {
        return new Encoding(encoding.APPLICATION_JSON)
    }
    static TEXT_JSON(): Encoding {
        return new Encoding(encoding.TEXT_JSON)
    }
    static APPLICATION_CDR(): Encoding {
        return new Encoding(encoding.APPLICATION_CDR)
    }
    static APPLICATION_CBOR(): Encoding {
        return new Encoding(encoding.APPLICATION_CBOR)
    }
    static APPLICATION_YAML(): Encoding {
        return new Encoding(encoding.APPLICATION_YAML)
    }
    static TEXT_YAML(): Encoding {
        return new Encoding(encoding.TEXT_YAML)
    }
    static TEXT_JSON5(): Encoding {
        return new Encoding(encoding.TEXT_JSON5)
    }
    static APPLICATION_PROTOBUF(): Encoding {
        return new Encoding(encoding.APPLICATION_PROTOBUF)
    }
    static APPLICATION_PYTHON_SERIALIZED_OBJECT(): Encoding {
        return new Encoding(encoding.APPLICATION_PYTHON_SERIALIZED_OBJECT)
    }
    static APPLICATION_JAVA_SERIALIZED_OBJECT(): Encoding {
        return new Encoding(encoding.APPLICATION_JAVA_SERIALIZED_OBJECT)
    }
    static APPLICATION_OPENMETRICS_TEXT(): Encoding {
        return new Encoding(encoding.APPLICATION_OPENMETRICS_TEXT)
    }
    static IMAGE_PNG(): Encoding {
        return new Encoding(encoding.IMAGE_PNG)
    }
    static IMAGE_JPEG(): Encoding {
        return new Encoding(encoding.IMAGE_JPEG)
    }
    static IMAGE_GIF(): Encoding {
        return new Encoding(encoding.IMAGE_GIF)
    }
    static IMAGE_BMP(): Encoding {
        return new Encoding(encoding.IMAGE_BMP)
    }
    static IMAGE_WEBP(): Encoding {
        return new Encoding(encoding.IMAGE_WEBP)
    }
    static APPLICATION_XML(): Encoding {
        return new Encoding(encoding.APPLICATION_XML)
    }
    static APPLICATION_X_WWW_FORM_URLENCODED(): Encoding {
        return new Encoding(encoding.APPLICATION_X_WWW_FORM_URLENCODED)
    }
    static TEXT_HTML(): Encoding {
        return new Encoding(encoding.TEXT_HTML)
    }
    static TEXT_XML(): Encoding {
        return new Encoding(encoding.TEXT_XML)
    }
    static TEXT_CSS(): Encoding {
        return new Encoding(encoding.TEXT_CSS)
    }
    static TEXT_JAVASCRIPT(): Encoding {
        return new Encoding(encoding.TEXT_JAVASCRIPT)
    }
    static TEXT_MARKDOWN(): Encoding {
        return new Encoding(encoding.TEXT_MARKDOWN)
    }
    static TEXT_CSV(): Encoding {
        return new Encoding(encoding.TEXT_CSV)
    }
    static APPLICATION_SQL(): Encoding {
        return new Encoding(encoding.APPLICATION_SQL)
    }
    static APPLICATION_COAP_PAYLOAD(): Encoding {
        return new Encoding(encoding.APPLICATION_COAP_PAYLOAD)
    }
    static APPLICATION_JSON_PATCH_JSON(): Encoding {
        return new Encoding(encoding.APPLICATION_JSON_PATCH_JSON)
    }
    static APPLICATION_JSON_SEQ(): Encoding {
        return new Encoding(encoding.APPLICATION_JSON_SEQ)
    }
    static APPLICATION_JSONPATH(): Encoding {
        return new Encoding(encoding.APPLICATION_JSONPATH)
    }
    static APPLICATION_JWT(): Encoding {
        return new Encoding(encoding.APPLICATION_JWT)
    }
    static APPLICATION_MP4(): Encoding {
        return new Encoding(encoding.APPLICATION_MP4)
    }
    static APPLICATION_SOAP_XML(): Encoding {
        return new Encoding(encoding.APPLICATION_SOAP_XML)
    }
    static APPLICATION_YANG(): Encoding {
        return new Encoding(encoding.APPLICATION_YANG)
    }
    static AUDIO_AAC(): Encoding {
        return new Encoding(encoding.AUDIO_AAC)
    }
    static AUDIO_FLAC(): Encoding {
        return new Encoding(encoding.AUDIO_FLAC)
    }
    static AUDIO_MP4(): Encoding {
        return new Encoding(encoding.AUDIO_MP4)
    }
    static AUDIO_OGG(): Encoding {
        return new Encoding(encoding.AUDIO_OGG)
    }
    static AUDIO_VORBIS(): Encoding {
        return new Encoding(encoding.AUDIO_VORBIS)
    }
    static VIDEO_H261(): Encoding {
        return new Encoding(encoding.VIDEO_H261)
    }
    static VIDEO_H263(): Encoding {
        return new Encoding(encoding.VIDEO_H263)
    }
    static VIDEO_H264(): Encoding {
        return new Encoding(encoding.VIDEO_H264)
    }
    static VIDEO_H265(): Encoding {
        return new Encoding(encoding.VIDEO_H265)
    }
    static VIDEO_H266(): Encoding {
        return new Encoding(encoding.VIDEO_H266)
    }
    static VIDEO_MP4(): Encoding {
        return new Encoding(encoding.VIDEO_MP4)
    }
    static VIDEO_OGG(): Encoding {
        return new Encoding(encoding.VIDEO_OGG)
    }
    static VIDEO_RAW(): Encoding {
        return new Encoding(encoding.VIDEO_RAW)
    }
    static VIDEO_VP8(): Encoding {
        return new Encoding(encoding.VIDEO_VP8)
    }
    static VIDEO_VP9(): Encoding {
        return new Encoding(encoding.VIDEO_VP9)
    }
}

enum encoding {
    ZENOH_BYTES = "zenoh/bytes"
    , ZENOH_INT8 = "zenoh/int8"
    , ZENOH_INT16 = "zenoh/int16"
    , ZENOH_INT32 = "zenoh/int32"
    , ZENOH_INT64 = "zenoh/int64"
    , ZENOH_INT128 = "zenoh/int128"
    , ZENOH_UINT8 = "zenoh/uint8"
    , ZENOH_UINT16 = "zenoh/uint16"
    , ZENOH_UINT32 = "zenoh/uint32"
    , ZENOH_UINT64 = "zenoh/uint64"
    , ZENOH_UINT128 = "zenoh/uint128"
    , ZENOH_FLOAT32 = "zenoh/float32"
    , ZENOH_FLOAT64 = "zenoh/float64"
    , ZENOH_BOOL = "zenoh/bool"
    , ZENOH_STRING = "zenoh/string"
    , ZENOH_ERROR = "zenoh/error"
    , APPLICATION_OCTET_STREAM = "application/octet-stream"
    , TEXT_PLAIN = "text/plain"
    , APPLICATION_JSON = "application/json"
    , TEXT_JSON = "text/json"
    , APPLICATION_CDR = "application/cdr"
    , APPLICATION_CBOR = "application/cbor"
    , APPLICATION_YAML = "application/yaml"
    , TEXT_YAML = "text/yaml"
    , TEXT_JSON5 = "text/json5"
    , APPLICATION_PROTOBUF = "application/protobuf"
    , APPLICATION_PYTHON_SERIALIZED_OBJECT = "application/python-serialized-object"
    , APPLICATION_JAVA_SERIALIZED_OBJECT = "application/java-serialized-object"
    , APPLICATION_OPENMETRICS_TEXT = "application/openmetrics-text"
    , IMAGE_PNG = "image/png"
    , IMAGE_JPEG = "image/jpeg"
    , IMAGE_GIF = "image/gif"
    , IMAGE_BMP = "image/bmp"
    , IMAGE_WEBP = "image/webp"
    , APPLICATION_XML = "application/xml"
    , APPLICATION_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded"
    , TEXT_HTML = "text/html"
    , TEXT_XML = "text/xml"
    , TEXT_CSS = "text/css"
    , TEXT_JAVASCRIPT = "text/javascript"
    , TEXT_MARKDOWN = "text/markdown"
    , TEXT_CSV = "text/csv"
    , APPLICATION_SQL = "application/sql"
    , APPLICATION_COAP_PAYLOAD = "application/coap-payload"
    , APPLICATION_JSON_PATCH_JSON = "application/json-patch+json"
    , APPLICATION_JSON_SEQ = "application/json-seq"
    , APPLICATION_JSONPATH = "application/jsonpath"
    , APPLICATION_JWT = "application/jwt"
    , APPLICATION_MP4 = "application/mp4"
    , APPLICATION_SOAP_XML = "application/soap+xml"
    , APPLICATION_YANG = "application/yang"
    , AUDIO_AAC = "audio/aac"
    , AUDIO_FLAC = "audio/flac"
    , AUDIO_MP4 = "audio/mp4"
    , AUDIO_OGG = "audio/ogg"
    , AUDIO_VORBIS = "audio/vorbis"
    , VIDEO_H261 = "video/h261"
    , VIDEO_H263 = "video/h263"
    , VIDEO_H264 = "video/h264"
    , VIDEO_H265 = "video/h265"
    , VIDEO_H266 = "video/h266"
    , VIDEO_MP4 = "video/mp4"
    , VIDEO_OGG = "video/ogg"
    , VIDEO_RAW = "video/raw"
    , VIDEO_VP8 = "video/vp8"
    , VIDEO_VP9 = "video/vp9"
}
