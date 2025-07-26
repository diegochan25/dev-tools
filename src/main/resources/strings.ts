import path from "path";

export const strings = {
    ROOT_DIR: path.resolve(path.join(import.meta.dirname, "..", "..", "..")),
    TEMPLATE_PATH: path.resolve(path.join(import.meta.dirname, "..", "ts", "templates"))
};