import {Minifier} from "https://deno.land/x/minifier@v0.3.0/mod.ts";

const minifier = new Minifier();

export default (text: string, compressionLevel: number): string => minifier.string(text, "html");
