import type { SchoolModuleManifest } from "../../shared/src/module-contract";
export const GRADE_MODULE: SchoolModuleManifest = {
  moduleId:"grade", version:"1.0.0", displayName:"Grade", status:"available",
  dependencies:[
    {moduleId:"school",contractVersion:"1.0.0",required:true},
    {moduleId:"totals",contractVersion:"1.0.0",required:true},
  ],
};
