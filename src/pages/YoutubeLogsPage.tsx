import { useEffect } from "react";
import { getSpaceEngineers2Videos } from "../services/youtubeService";

const YoutubeLogsPage = () => {
  useEffect(() => {
    (async () => {
      console.group("Fetch Space Engineers 2 Videos");
      const videos = await getSpaceEngineers2Videos();
      console.log("Videos retrieved:", videos);
      console.groupEnd();
    })();
  }, []);

  return (
    <div>
      <h1>Space Engineers 2 Videos Logs</h1>
      <p>Check your console for detailed logs.</p>
    </div>
  );
};

export default YoutubeLogsPage;
