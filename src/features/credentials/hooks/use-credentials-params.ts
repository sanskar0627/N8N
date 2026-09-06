import { useQueryStates } from "nuqs";
import { credentialsParams } from "../params";

export const useCredentialsParams = () => useQueryStates(credentialsParams);
