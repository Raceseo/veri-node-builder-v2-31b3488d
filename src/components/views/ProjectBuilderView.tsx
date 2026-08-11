import { useState } from "react";
import {
  ArrowLeft, Plus, Trash2, FileText, Users, Zap, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

/**
 * 베타 임시 단가(원/응답 1건). 정식 가격이 아니다.
 * 근거 3출처 수렴: 김박사넷 지불의향 500~1,500 · 간호카페 분당 330(≈3분 1,000) · 오픈서베이 500 대비 프리미엄.
 * 정식 가격 설계는 게이트 판정 후 별건 — 화면에 "정식 가격은 오픈 시 확정"을 반드시 병기한다.
 */
const UNIT_PRICE = 1000;

interface Question {
  id: string;
  text: string;
}

interface TemplateConfig {
  categoryId: string;
  categoryName: string;
  templateId: string;
  templateName: string;
  questions: Question[];
  requiredApis: string[];
  targetGrade: number;
}

interface ProjectBuilderViewProps {
  onBack: () => void;
  initialTemplate?: TemplateConfig | null;
}

const ProjectBuilderView = ({ onBack, initialTemplate }: ProjectBuilderViewProps) => {
  const [projectName, setProjectName] = useState(
    initialTemplate ? `${initialTemplate.categoryName} - ${initialTemplate.templateName}` : ""
  );
  const [researchPurpose, setResearchPurpose] = useState("");
  const [targetCount, setTargetCount] = useState(100);
  const [questions, setQuestions] = useState<Question[]>(
    initialTemplate?.questions?.length
      ? initialTemplate.questions
      : [{ id: "1", text: "" }]
  );

  const estimatedCost = targetCount * UNIT_PRICE;

  const addQuestion = () => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      text: "",
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast({ title: "입력 필요", description: "프로젝트 명을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!researchPurpose.trim()) {
      toast({ title: "입력 필요", description: "조사 목적을 입력해주세요.", variant: "destructive" });
      return;
    }
    // 제출 처리(status='draft' INSERT)는 다음 단계에서 붙인다.
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-200">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">프로젝트 의뢰 빌더</h1>
          <p className="text-xs text-slate-500">Project Request Builder</p>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-32">
        {/* ===== 1. 프로젝트 설정 섹션 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-slate-900">프로젝트 설정</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">프로젝트 명 *</label>
              <Input 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 2024 MZ세대 소비 트렌드 조사"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">조사 목적 *</label>
              <Textarea 
                value={researchPurpose}
                onChange={(e) => setResearchPurpose(e.target.value)}
                placeholder="본 조사의 목적과 활용 계획을 상세히 기술해주세요."
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">타겟 응답자 수</label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-500 text-sm">명</span>
                <div className="flex items-center gap-1 ml-auto text-blue-600 text-sm">
                  <Users className="w-4 h-4" />
                  <span>최소 10명 이상</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3. 질문 속성 연결 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-slate-900">질문 구성</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addQuestion}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" /> 질문 추가
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div 
                key={question.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">질문 {index + 1}</span>
                  {questions.length > 1 && (
                    <button 
                      onClick={() => removeQuestion(question.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Input 
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="질문 내용을 입력하세요"
                  className="border-slate-300"
                />

              </div>
            ))}
          </div>

        </section>

        {/* ===== 예상 비용 ===== */}
        <section className="bg-slate-900 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">예상 비용</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">응답 수집</span>
              <span className="text-white">₩{UNIT_PRICE.toLocaleString()} × {targetCount}명</span>
            </div>
            <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
              <span className="text-white font-medium">예상 비용</span>
              <span className="text-2xl font-bold text-amber-400">₩{estimatedCost.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            베타 기간 임시 단가입니다. 정식 가격은 오픈 시 확정됩니다.
          </p>
        </section>

      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 shadow-lg"
        >
          제출하기
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">
          예상 비용 ₩{estimatedCost.toLocaleString()} · 정식 가격은 오픈 시 확정
        </p>
      </div>
    </div>
  );
};

export default ProjectBuilderView;
