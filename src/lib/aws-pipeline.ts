import { supabase } from "@/integrations/supabase/client";

export interface AWSPipelineState {
  pipelineName: string;
  stageStates: Array<{
    stageName: string;
    latestExecution?: {
      status: string;
    };
    actionStates: Array<{
      actionName: string;
      latestExecution?: {
        status: string;
        lastStatusChange: string;
        summary?: string;
      };
    }>;
  }>;
}

export interface AWSPipelineExecution {
  pipelineExecutionId: string;
  status: string;
  startTime: string;
  lastUpdateTime: string;
  sourceRevisions?: Array<{
    actionName: string;
    revisionId: string;
    revisionSummary?: string;
  }>;
  trigger?: {
    triggerType: string;
    triggerDetail: string;
  };
}

export async function callAWSPipeline(action: string, pipelineName: string) {
  const { data, error } = await supabase.functions.invoke("aws-pipeline", {
    body: { action, pipelineName },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function listPipelines() {
  return callAWSPipeline("listPipelines", "");
}

export async function getPipelineState(pipelineName: string): Promise<AWSPipelineState> {
  return callAWSPipeline("getPipelineState", pipelineName);
}

export async function listPipelineExecutions(pipelineName: string): Promise<{ pipelineExecutionSummaries: AWSPipelineExecution[] }> {
  return callAWSPipeline("listPipelineExecutions", pipelineName);
}

export async function startPipelineExecution(pipelineName: string) {
  return callAWSPipeline("startPipelineExecution", pipelineName);
}
