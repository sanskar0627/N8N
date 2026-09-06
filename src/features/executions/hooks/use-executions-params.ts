import { useQueryStates } from "nuqs";
import { executionsParams } from "../params";

export const useExecutionsParams = () => useQueryStates(executionsParams);
