export const dimensionGuides = {
  lvidd: {
    label: "充盈時的心室內徑",
    code: "LVIDd",
    phase: "ed",
    question: "心室裝滿血時，有多寬？",
    instruction: "找心室較大的畫面，再連起腔室兩側的內壁。",
    meaning: "心室充盈時，腔室內部的寬度。",
    purpose: "協助醫生觀察心室大小，以及追蹤腔室擴張與結構變化。",
    anatomy: "腔室內部",
  },
  lvids: {
    label: "收縮後的心室內徑",
    code: "LVIDs",
    phase: "es",
    question: "心室收縮後，還有多寬？",
    instruction: "找心室較小的畫面，再連起腔室兩側的內壁。",
    meaning: "心室收縮後，腔室內部的寬度。",
    purpose: "與充盈時的內徑一起，幫助醫生觀察收縮時腔室的變化。",
    anatomy: "腔室內部",
  },
  ivsd: {
    label: "室間隔厚度",
    code: "IVSd",
    phase: "ed",
    question: "兩個心室之間的壁，有多厚？",
    instruction: "選充盈時的畫面，在室間隔的兩側各點一下。",
    meaning: "充盈時，左右心室之間心肌壁的厚度。",
    purpose: "用於觀察心肌厚度和結構，協助醫生評估心室增厚等變化。",
    anatomy: "心室之間的壁",
  },
  lvpwd: {
    label: "心室後壁厚度",
    code: "LVPWd",
    phase: "ed",
    question: "心室後方的壁，有多厚？",
    instruction: "選充盈時的畫面，在後壁的內界和外界各點一下。",
    meaning: "充盈時，左心室後方心肌壁的厚度。",
    purpose: "與室間隔及心室內徑一起，幫助醫生了解心室結構的變化。",
    anatomy: "心室後方的壁",
  },
} as const;
export const medicalSources = [
  {
    title: "American Heart Association · 射血分數",
    url: "https://www.heart.org/en/health-topics/heart-failure/diagnosing-heart-failure/ejection-fraction-heart-failure-measurement",
  },
  {
    title: "ASE / EACVI · 心腔量測指南",
    url: "https://www.asecho.org/guideline/cardiac-chamber-quantification-by-echo-in-adults/",
  },
];
