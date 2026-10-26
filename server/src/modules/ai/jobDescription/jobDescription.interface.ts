export interface IGeneratedJobDescription {
  description: string;
  responsibilities: string[];
  requirements: string[];
}

export type JobDescriptionStreamEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; result: IGeneratedJobDescription };
