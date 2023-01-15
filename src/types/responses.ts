// To parse this data:
//
//   import { Convert, ETS2Response } from "./file";
//
//   const eTS2Response = Convert.toETS2Response(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface ETS2Response {
    game?: Game;
    truck?: Truck;
    trailer?: Trailer;
    job?: Job;
    navigation?: Navigation;
}

export interface Game {
    connected?: boolean;
    gameName?: string;
    paused?: boolean;
    time?: Date;
    timeScale?: number;
    nextRestStopTime?: Date;
    version?: string;
    telemetryPluginVersion?: string;
}

export interface Job {
    income?: number;
    deadlineTime?: Date;
    remainingTime?: Date;
    sourceCity?: string;
    sourceCompany?: string;
    destinationCity?: string;
    destinationCompany?: string;
}

export interface Navigation {
    estimatedTime?: Date;
    estimatedDistance?: number;
    speedLimit?: number;
}

export interface Trailer {
    attached?: boolean;
    id?: string;
    name?: string;
    mass?: number;
    wear?: number;
    placement?: Placement;
}

export interface Placement {
    x?: number;
    y?: number;
    z?: number;
    heading?: number;
    pitch?: number;
    roll?: number;
}

export interface Truck {
    id?: string;
    make?: string;
    model?: string;
    speed?: number;
    cruiseControlSpeed?: number;
    cruiseControlOn?: boolean;
    odometer?: number;
    gear?: number;
    displayedGear?: number;
    forwardGears?: number;
    reverseGears?: number;
    shifterType?: string;
    engineRpm?: number;
    engineRpmMax?: number;
    fuel?: number;
    fuelCapacity?: number;
    fuelAverageConsumption?: number;
    fuelWarningFactor?: number;
    fuelWarningOn?: boolean;
    wearEngine?: number;
    wearTransmission?: number;
    wearCabin?: number;
    wearChassis?: number;
    wearWheels?: number;
    userSteer?: number;
    userThrottle?: number;
    userBrake?: number;
    userClutch?: number;
    gameSteer?: number;
    gameThrottle?: number;
    gameBrake?: number;
    gameClutch?: number;
    shifterSlot?: number;
    engineOn?: boolean;
    electricOn?: boolean;
    wipersOn?: boolean;
    retarderBrake?: number;
    retarderStepCount?: number;
    parkBrakeOn?: boolean;
    motorBrakeOn?: boolean;
    brakeTemperature?: number;
    adblue?: number;
    adblueCapacity?: number;
    adblueAverageConsumption?: number;
    adblueWarningOn?: boolean;
    airPressure?: number;
    airPressureWarningOn?: boolean;
    airPressureWarningValue?: number;
    airPressureEmergencyOn?: boolean;
    airPressureEmergencyValue?: number;
    oilTemperature?: number;
    oilPressure?: number;
    oilPressureWarningOn?: boolean;
    oilPressureWarningValue?: number;
    waterTemperature?: number;
    waterTemperatureWarningOn?: boolean;
    waterTemperatureWarningValue?: number;
    batteryVoltage?: number;
    batteryVoltageWarningOn?: boolean;
    batteryVoltageWarningValue?: number;
    lightsDashboardValue?: number;
    lightsDashboardOn?: boolean;
    blinkerLeftActive?: boolean;
    blinkerRightActive?: boolean;
    blinkerLeftOn?: boolean;
    blinkerRightOn?: boolean;
    lightsParkingOn?: boolean;
    lightsBeamLowOn?: boolean;
    lightsBeamHighOn?: boolean;
    lightsAuxFrontOn?: boolean;
    lightsAuxRoofOn?: boolean;
    lightsBeaconOn?: boolean;
    lightsBrakeOn?: boolean;
    lightsReverseOn?: boolean;
    placement?: Placement;
    acceleration?: Acceleration;
    head?: Acceleration;
    cabin?: Acceleration;
    hook?: Acceleration;
}

export interface Acceleration {
    x?: number;
    y?: number;
    z?: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toETS2Response(json: string): ETS2Response {
        return cast(JSON.parse(json), r("ETS2Response"));
    }

    public static eTS2ResponseToJson(value: ETS2Response): string {
        return JSON.stringify(uncast(value, r("ETS2Response")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "ETS2Response": o([
        { json: "game", js: "game", typ: u(undefined, r("Game")) },
        { json: "truck", js: "truck", typ: u(undefined, r("Truck")) },
        { json: "trailer", js: "trailer", typ: u(undefined, r("Trailer")) },
        { json: "job", js: "job", typ: u(undefined, r("Job")) },
        { json: "navigation", js: "navigation", typ: u(undefined, r("Navigation")) },
    ], false),
    "Game": o([
        { json: "connected", js: "connected", typ: u(undefined, true) },
        { json: "gameName", js: "gameName", typ: u(undefined, "") },
        { json: "paused", js: "paused", typ: u(undefined, true) },
        { json: "time", js: "time", typ: u(undefined, Date) },
        { json: "timeScale", js: "timeScale", typ: u(undefined, 0) },
        { json: "nextRestStopTime", js: "nextRestStopTime", typ: u(undefined, Date) },
        { json: "version", js: "version", typ: u(undefined, "") },
        { json: "telemetryPluginVersion", js: "telemetryPluginVersion", typ: u(undefined, "") },
    ], false),
    "Job": o([
        { json: "income", js: "income", typ: u(undefined, 0) },
        { json: "deadlineTime", js: "deadlineTime", typ: u(undefined, Date) },
        { json: "remainingTime", js: "remainingTime", typ: u(undefined, Date) },
        { json: "sourceCity", js: "sourceCity", typ: u(undefined, "") },
        { json: "sourceCompany", js: "sourceCompany", typ: u(undefined, "") },
        { json: "destinationCity", js: "destinationCity", typ: u(undefined, "") },
        { json: "destinationCompany", js: "destinationCompany", typ: u(undefined, "") },
    ], false),
    "Navigation": o([
        { json: "estimatedTime", js: "estimatedTime", typ: u(undefined, Date) },
        { json: "estimatedDistance", js: "estimatedDistance", typ: u(undefined, 0) },
        { json: "speedLimit", js: "speedLimit", typ: u(undefined, 0) },
    ], false),
    "Trailer": o([
        { json: "attached", js: "attached", typ: u(undefined, true) },
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "mass", js: "mass", typ: u(undefined, 0) },
        { json: "wear", js: "wear", typ: u(undefined, 3.14) },
        { json: "placement", js: "placement", typ: u(undefined, r("Placement")) },
    ], false),
    "Placement": o([
        { json: "x", js: "x", typ: u(undefined, 3.14) },
        { json: "y", js: "y", typ: u(undefined, 3.14) },
        { json: "z", js: "z", typ: u(undefined, 3.14) },
        { json: "heading", js: "heading", typ: u(undefined, 3.14) },
        { json: "pitch", js: "pitch", typ: u(undefined, 3.14) },
        { json: "roll", js: "roll", typ: u(undefined, 3.14) },
    ], false),
    "Truck": o([
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "make", js: "make", typ: u(undefined, "") },
        { json: "model", js: "model", typ: u(undefined, "") },
        { json: "speed", js: "speed", typ: u(undefined, 3.14) },
        { json: "cruiseControlSpeed", js: "cruiseControlSpeed", typ: u(undefined, 0) },
        { json: "cruiseControlOn", js: "cruiseControlOn", typ: u(undefined, true) },
        { json: "odometer", js: "odometer", typ: u(undefined, 3.14) },
        { json: "gear", js: "gear", typ: u(undefined, 0) },
        { json: "displayedGear", js: "displayedGear", typ: u(undefined, 0) },
        { json: "forwardGears", js: "forwardGears", typ: u(undefined, 0) },
        { json: "reverseGears", js: "reverseGears", typ: u(undefined, 0) },
        { json: "shifterType", js: "shifterType", typ: u(undefined, "") },
        { json: "engineRpm", js: "engineRpm", typ: u(undefined, 3.14) },
        { json: "engineRpmMax", js: "engineRpmMax", typ: u(undefined, 0) },
        { json: "fuel", js: "fuel", typ: u(undefined, 3.14) },
        { json: "fuelCapacity", js: "fuelCapacity", typ: u(undefined, 0) },
        { json: "fuelAverageConsumption", js: "fuelAverageConsumption", typ: u(undefined, 3.14) },
        { json: "fuelWarningFactor", js: "fuelWarningFactor", typ: u(undefined, 3.14) },
        { json: "fuelWarningOn", js: "fuelWarningOn", typ: u(undefined, true) },
        { json: "wearEngine", js: "wearEngine", typ: u(undefined, 3.14) },
        { json: "wearTransmission", js: "wearTransmission", typ: u(undefined, 3.14) },
        { json: "wearCabin", js: "wearCabin", typ: u(undefined, 3.14) },
        { json: "wearChassis", js: "wearChassis", typ: u(undefined, 3.14) },
        { json: "wearWheels", js: "wearWheels", typ: u(undefined, 3.14) },
        { json: "userSteer", js: "userSteer", typ: u(undefined, 0) },
        { json: "userThrottle", js: "userThrottle", typ: u(undefined, 0) },
        { json: "userBrake", js: "userBrake", typ: u(undefined, 0) },
        { json: "userClutch", js: "userClutch", typ: u(undefined, 0) },
        { json: "gameSteer", js: "gameSteer", typ: u(undefined, 3.14) },
        { json: "gameThrottle", js: "gameThrottle", typ: u(undefined, 3.14) },
        { json: "gameBrake", js: "gameBrake", typ: u(undefined, 0) },
        { json: "gameClutch", js: "gameClutch", typ: u(undefined, 0) },
        { json: "shifterSlot", js: "shifterSlot", typ: u(undefined, 0) },
        { json: "engineOn", js: "engineOn", typ: u(undefined, true) },
        { json: "electricOn", js: "electricOn", typ: u(undefined, true) },
        { json: "wipersOn", js: "wipersOn", typ: u(undefined, true) },
        { json: "retarderBrake", js: "retarderBrake", typ: u(undefined, 0) },
        { json: "retarderStepCount", js: "retarderStepCount", typ: u(undefined, 0) },
        { json: "parkBrakeOn", js: "parkBrakeOn", typ: u(undefined, true) },
        { json: "motorBrakeOn", js: "motorBrakeOn", typ: u(undefined, true) },
        { json: "brakeTemperature", js: "brakeTemperature", typ: u(undefined, 3.14) },
        { json: "adblue", js: "adblue", typ: u(undefined, 3.14) },
        { json: "adblueCapacity", js: "adblueCapacity", typ: u(undefined, 0) },
        { json: "adblueAverageConsumption", js: "adblueAverageConsumption", typ: u(undefined, 0) },
        { json: "adblueWarningOn", js: "adblueWarningOn", typ: u(undefined, true) },
        { json: "airPressure", js: "airPressure", typ: u(undefined, 3.14) },
        { json: "airPressureWarningOn", js: "airPressureWarningOn", typ: u(undefined, true) },
        { json: "airPressureWarningValue", js: "airPressureWarningValue", typ: u(undefined, 3.14) },
        { json: "airPressureEmergencyOn", js: "airPressureEmergencyOn", typ: u(undefined, true) },
        { json: "airPressureEmergencyValue", js: "airPressureEmergencyValue", typ: u(undefined, 3.14) },
        { json: "oilTemperature", js: "oilTemperature", typ: u(undefined, 3.14) },
        { json: "oilPressure", js: "oilPressure", typ: u(undefined, 3.14) },
        { json: "oilPressureWarningOn", js: "oilPressureWarningOn", typ: u(undefined, true) },
        { json: "oilPressureWarningValue", js: "oilPressureWarningValue", typ: u(undefined, 3.14) },
        { json: "waterTemperature", js: "waterTemperature", typ: u(undefined, 3.14) },
        { json: "waterTemperatureWarningOn", js: "waterTemperatureWarningOn", typ: u(undefined, true) },
        { json: "waterTemperatureWarningValue", js: "waterTemperatureWarningValue", typ: u(undefined, 0) },
        { json: "batteryVoltage", js: "batteryVoltage", typ: u(undefined, 3.14) },
        { json: "batteryVoltageWarningOn", js: "batteryVoltageWarningOn", typ: u(undefined, true) },
        { json: "batteryVoltageWarningValue", js: "batteryVoltageWarningValue", typ: u(undefined, 3.14) },
        { json: "lightsDashboardValue", js: "lightsDashboardValue", typ: u(undefined, 3.14) },
        { json: "lightsDashboardOn", js: "lightsDashboardOn", typ: u(undefined, true) },
        { json: "blinkerLeftActive", js: "blinkerLeftActive", typ: u(undefined, true) },
        { json: "blinkerRightActive", js: "blinkerRightActive", typ: u(undefined, true) },
        { json: "blinkerLeftOn", js: "blinkerLeftOn", typ: u(undefined, true) },
        { json: "blinkerRightOn", js: "blinkerRightOn", typ: u(undefined, true) },
        { json: "lightsParkingOn", js: "lightsParkingOn", typ: u(undefined, true) },
        { json: "lightsBeamLowOn", js: "lightsBeamLowOn", typ: u(undefined, true) },
        { json: "lightsBeamHighOn", js: "lightsBeamHighOn", typ: u(undefined, true) },
        { json: "lightsAuxFrontOn", js: "lightsAuxFrontOn", typ: u(undefined, true) },
        { json: "lightsAuxRoofOn", js: "lightsAuxRoofOn", typ: u(undefined, true) },
        { json: "lightsBeaconOn", js: "lightsBeaconOn", typ: u(undefined, true) },
        { json: "lightsBrakeOn", js: "lightsBrakeOn", typ: u(undefined, true) },
        { json: "lightsReverseOn", js: "lightsReverseOn", typ: u(undefined, true) },
        { json: "placement", js: "placement", typ: u(undefined, r("Placement")) },
        { json: "acceleration", js: "acceleration", typ: u(undefined, r("Acceleration")) },
        { json: "head", js: "head", typ: u(undefined, r("Acceleration")) },
        { json: "cabin", js: "cabin", typ: u(undefined, r("Acceleration")) },
        { json: "hook", js: "hook", typ: u(undefined, r("Acceleration")) },
    ], false),
    "Acceleration": o([
        { json: "x", js: "x", typ: u(undefined, 3.14) },
        { json: "y", js: "y", typ: u(undefined, 3.14) },
        { json: "z", js: "z", typ: u(undefined, 3.14) },
    ], false),
};
