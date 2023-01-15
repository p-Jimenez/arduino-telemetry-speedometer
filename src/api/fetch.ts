import { ETS2Response } from "../types/responses";

const fetchETS2 = async () => {
    const response = fetch('http://localhost:25555/api/ets2/telemetry');

    const data = await (await response).json() satisfies ETS2Response;

    return data as ETS2Response;
}

export { fetchETS2 };