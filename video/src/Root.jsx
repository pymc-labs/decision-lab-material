import React from "react";
import { Composition } from "remotion";
import { DecisionLabDemo } from "./DecisionLabDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="DecisionLabDemo"
      component={DecisionLabDemo}
      durationInFrames={1500}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
