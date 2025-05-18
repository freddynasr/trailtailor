"use client";
import MediaComponent from "@/components/media";
import { getMedia } from "@/lib/queries";
import { GetMediaFiles } from "@/lib/types";
import React, { useEffect, useState } from "react";

type Props = {
  projectId: string;
};

const MediaBucketTab = (props: Props) => {
  const [data, setdata] = useState<GetMediaFiles>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getMedia(props.projectId);
      setdata(response);
    };
    fetchData();
  }, [props.projectId]);

  return (
    <div className="h-[900px] overflow-scroll p-4">
      <MediaComponent data={data} projectId={props.projectId} />
    </div>
  );
};

export default MediaBucketTab;
