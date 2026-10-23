export interface ExhibitionMedia {
  label: string;
  src: string;
  alt: string;
  type: "image" | "video";
  poster?: string;
  caption: string;
}

export interface ExhibitionProject {
  id: string;
  number: string;
  english: string;
  title: string;
  question: string;
  description: string;
  icon: string;
  poster: string;
  tags: string[];
  steps: string[];
  media: ExhibitionMedia[];
  link?: { label: string; href: string };
}

export const exhibitionAsset = (name: string) => `${import.meta.env.BASE_URL}exhibition/${name}`;

export const projects: ExhibitionProject[] = [
  {
    id: "visualization",
    number: "01",
    english: "3D VISUALIZATION",
    title: "探索三維心臟結構",
    question: "換個角度，看見心臟裡面。",
    description: "將三維超聲轉為立體呈現，透過旋轉與切面，觀察內部腔體和組織的空間關係。",
    icon: "layers",
    poster: "visualization.jpg",
    tags: ["立體呈現", "自由切面", "內部結構"],
    steps: ["三維超聲影像", "高斯立體表示", "旋轉與切面探索"],
    media: [
      {
        label: "切面演示",
        src: "heart-clipping.mp4",
        type: "video",
        poster: "clipping-poster.jpg",
        alt: "三維心臟內部結構的旋轉與切面比較影片",
        caption:
          "同一三維超聲的兩種呈現方式：左側為體繪製，右側為高斯表示；影片展示連續旋轉和切面探索。",
      },
      {
        label: "軟件介面",
        src: "visualization.jpg",
        type: "image",
        alt: "三維視覺化軟件介面，包含切面控制和心臟內部結構",
        caption: "研究軟件中的三維切面與視角控制。此處展示實際介面截圖。",
      },
      {
        label: "表示建立",
        src: "gaussian-evolution.mp4",
        type: "video",
        poster: "clipping-poster.jpg",
        alt: "高斯表示隨訓練逐步形成組織外觀的影片",
        caption: "建立三維表示的過程：左側展示高斯幾何，右側展示對應渲染結果。",
      },
    ],
  },
  {
    id: "segmentation",
    number: "02",
    english: "ANATOMY-GUIDED SEGMENTATION",
    title: "辨識二尖瓣的形態",
    question: "從複雜影像，分清瓣膜結構。",
    description: "結合影像與解剖知識，辨識二尖瓣前葉和後葉，將邊界與三維形態呈現出來。",
    icon: "scan",
    poster: "leaflets-case-1.jpg",
    tags: ["解剖引導", "瓣膜分割", "三維形態"],
    steps: ["超聲與解剖描述", "結構先驗與局部細化", "瓣膜分割結果"],
    media: [
      {
        label: "示例一",
        src: "leaflets-case-1.jpg",
        type: "image",
        alt: "二尖瓣分割示例一，超聲切片及紅綠兩色的瓣葉三維形態",
        caption: "上方為超聲切片中的分割疊加，下方呈現兩片瓣葉的三維形態。不同顏色區分瓣葉結構。",
      },
      {
        label: "示例二",
        src: "leaflets-case-2.jpg",
        type: "image",
        alt: "二尖瓣分割示例二，展示另一組切片和三維瓣葉",
        caption: "另一組實際分割結果，結合切片與三維視角觀察瓣膜形態。",
      },
      {
        label: "方法與對照",
        src: "segmentation-method.jpg",
        type: "image",
        alt: "解剖引導分割方法圖，以及模型結果與專家標註對照",
        caption: "解剖描述引導結構先驗，再以影像細化分割；下方提供模型結果與專家標註的視覺對照。",
      },
    ],
  },
  {
    id: "analysis",
    number: "03",
    english: "VIDEO-BASED CARDIAC ANALYSIS",
    title: "從影片到心臟量測",
    question: "找到關鍵時刻，也看見量測依據。",
    description: "同一模型處理不同切面的影片，定位充盈與收縮畫面，呈現輪廓、量測線及對應心臟指標。",
    icon: "chart",
    poster: "clinical-workstation.jpg",
    tags: ["關鍵幀定位", "功能與尺寸", "影像依據"],
    steps: ["心臟超聲影片", "定位時刻與量測位置", "指標與證據回看"],
    link: { label: "開啟互動工作站", href: "#/clinical" },
    media: [
      {
        label: "工作站介面",
        src: "clinical-workstation.jpg",
        type: "image",
        alt: "iHeart 臨床分析工作站，包含影片、量測表、關鍵幀和報告預覽",
        caption: "實際工作站介面：選擇檢查、回看關鍵幀和輪廓、核查量測，並預覽報告。",
      },
      {
        label: "功能介紹",
        src: "video-analysis.mp4",
        type: "video",
        poster: "clinical-workstation.jpg",
        alt: "心超影片關鍵幀、輪廓、射血分數與尺寸量測的介紹影片",
        caption: "影片展示不同切面的功能與幾何量測；不同示範病例分別呈現適用指標。",
      },
      {
        label: "方法與結果",
        src: "analysis-method.jpg",
        type: "image",
        alt: "統一影片模型的任務、功能量測及尺寸量測結果圖",
        caption: "統一影片模型連接關鍵幀、左心室輪廓與幾何端點，支援功能、容積、內徑和壁厚量測。",
      },
    ],
  },
];
