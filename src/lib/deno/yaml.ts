import {parse} from "https://deno.land/std@0.79.0/encoding/yaml.ts";

export default (file: string): any => parse(Deno.readTextFileSync(file));
