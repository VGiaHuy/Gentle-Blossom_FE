namespace Gentle_Blossom_FE.Data.Constants
{
    public class AnalyzePost
    {
        public const string RiskLevel_Low = "LOW";
        public const string RiskLevel_High = "HIGH";

        public const string AnalysisStatus_Pending = "PENDING";
        public const string AnalysisStatus_Complete = "COMPLETED";
        public const string AnalysisStatus_Failed = "FAILED";


        public static readonly List<string> All = new()
        {
            RiskLevel_Low, RiskLevel_High, AnalysisStatus_Pending, AnalysisStatus_Complete, AnalysisStatus_Failed
        };
    }
}
