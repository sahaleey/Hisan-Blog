export type SubmissionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<"title" | "genre" | "language" | "excerpt" | "content", string>>;
};

export const initialSubmissionState: SubmissionState = {
  status: "idle",
  message: "",
};
