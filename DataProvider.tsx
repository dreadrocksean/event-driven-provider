import React, {
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";

export interface Data {
    item: object;
}

export interface ProviderResponse {
  data: Data[];
  error?: Error;
  reset: () => void;
}

export interface dataProviderProps {
  apiUrl: string;
  storeName: string;
  versionNumber?: number;
}

const NAMESPACE = "company";
const responseTypes = { RESPONSE_TYPE: "", REQUEST_TYPE: ""};
const setResponseTypes = (storeName, versionNumber) => {
    const TYPE_BASE = `${NAMESPACE}/${storeName}/v${versionNumber}`;
    responseTypes.RESPONSE_TYPE = `${TYPE_BASE}/response`;
    responseTypes.REQUEST_TYPE = `${TYPE_BASE}/request`;
}

const init: ProviderResponse = {
  data: [],
  reset() {},
};

const DataProvider: FC<dataProviderProps> = ({
  apiUrl, storeName, versionNumber = 1
}): ReactElement | null => {
  setResponseTypes(storeName, versionNumber); 
  const [data, setData] = useState(
    init.data
  );
  const [error, setError] = useState<Error | undefined>(undefined);


  const reset = useCallback(async () => {
    setData([]);
    setError(undefined);

    try {
      const res = await fetch(apiUrl);
      const data = res.json();
        setData(data ?? []);
    } catch (error: unknown) {
      setError(error as Error);
    }
  }, []);

  const postMessage = useCallback(() => {
    window.postMessage({
      type: responseTypes.RESPONSE_TYPE,
      payload: { data, error },
    });
  }, [data, error]);

  useEffect(() => {
    const func = (event: MessageEvent) => {
      if (event.data?.type === responseTypes.REQUEST_TYPE) postMessage();
    };

    postMessage();
    window.addEventListener("message", func);
    return () => {
      window.removeEventListener("message", func);
    };
  }, [postMessage]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reset();
  }, [reset]);

  return null;
};

export const usedata = () => {
  const [data, setData] = useState<ProviderResponse>(init);

  useEffect(() => {
    window.postMessage({ type: responseTypes.REQUEST_TYPE });
  }, []);

  useEffect(() => {
    const func = (event: MessageEvent) => {
      if (event.data.type === responseTypes.RESPONSE_TYPE) {
        const payload = event.data.payload;
        console.log("payload from window response event", payload);
        setData(payload);
      }
    };

    window.addEventListener("message", func);
    return () => {
      window.removeEventListener("message", func);
    };
  }, []);

  return data;
};

export default DataProvider;
