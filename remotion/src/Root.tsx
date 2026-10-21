import { Composition } from "remotion";
import { PD_DUR, Prisoner } from "./prisoner/Prisoner";
import { Protein, PT_DUR } from "./protein/Protein";

// 知识大赏的两支样片。配乐由 tools/synth_piano.py 生成到 public/(见 README)。
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Prisoner" component={Prisoner} durationInFrames={PD_DUR * 30} fps={30} width={1920} height={1080} />
      <Composition id="Protein" component={Protein} durationInFrames={PT_DUR * 30} fps={30} width={1920} height={1080} />
    </>
  );
};
