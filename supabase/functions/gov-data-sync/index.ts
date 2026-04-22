import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 정부 기관 목록 (데모용)
const GOV_AGENCIES = {
  tax: [
    { code: 'hometax', name: '국세청 홈택스', type: 'tax', icon: '🏛️' },
    { code: 'wetax', name: '지방세 위택스', type: 'tax', icon: '🏢' },
  ],
  health: [
    { code: 'nhis', name: '국민건강보험공단', type: 'health', icon: '🏥' },
    { code: 'hira', name: '건강보험심사평가원', type: 'health', icon: '💊' },
  ],
  housing: [
    { code: 'myhome', name: '마이홈 포털', type: 'housing', icon: '🏠' },
    { code: 'gov24', name: '정부24 주민등록', type: 'housing', icon: '📋' },
  ],
  education: [
    { code: 'neis', name: '교육행정정보시스템', type: 'education', icon: '🎓' },
    { code: 'academic', name: '학력인증센터', type: 'education', icon: '📜' },
  ],
  military: [
    { code: 'mma', name: '병무청', type: 'military', icon: '🎖️' },
  ],
  certification: [
    { code: 'q-net', name: '한국산업인력공단', type: 'certification', icon: '📝' },
    { code: 'krivet', name: '한국직업능력연구원', type: 'certification', icon: '🏆' },
  ],
};

// 데모 데이터 생성 함수들
function generateTaxRecords(userId: string, connectionId: string): any[] {
  const records = [];
  const currentYear = new Date().getFullYear();
  
  // 소득금액증명원
  const annualIncome = 35000000 + Math.floor(Math.random() * 35000000);
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'tax',
    record_type: 'income_certificate',
    record_date: `${currentYear}-01-01`,
    data_json: {
      year: currentYear - 1,
      total_income: annualIncome,
      salary_income: Math.floor(annualIncome * 0.85),
      business_income: Math.floor(annualIncome * 0.1),
      other_income: Math.floor(annualIncome * 0.05),
      tax_paid: Math.floor(annualIncome * 0.15),
      issue_date: new Date().toISOString().split('T')[0],
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    expiry_date: `${currentYear + 1}-12-31`,
  });

  // 납세증명서
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'tax',
    record_type: 'tax_payment_cert',
    record_date: new Date().toISOString().split('T')[0],
    data_json: {
      has_unpaid_tax: false,
      last_payment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_grade: ['A', 'A', 'B'][Math.floor(Math.random() * 3)],
      consecutive_years: 3 + Math.floor(Math.random() * 5),
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // 4대보험 납부내역
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    records.push({
      user_id: userId,
      connection_id: connectionId,
      data_category: 'tax',
      record_type: 'insurance_payment',
      record_date: date.toISOString().split('T')[0],
      data_json: {
        month: date.toISOString().slice(0, 7),
        national_pension: 200000 + Math.floor(Math.random() * 50000),
        health_insurance: 150000 + Math.floor(Math.random() * 30000),
        employment_insurance: 30000 + Math.floor(Math.random() * 10000),
        industrial_accident: 15000 + Math.floor(Math.random() * 5000),
        payment_status: 'paid',
      },
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
  }

  return records;
}

function generateHealthRecords(userId: string, connectionId: string): any[] {
  const records = [];
  const currentYear = new Date().getFullYear();

  // 건강검진 결과
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'health',
    record_type: 'health_checkup',
    record_date: `${currentYear}-03-15`,
    data_json: {
      checkup_date: `${currentYear}-03-15`,
      checkup_type: '일반건강검진',
      overall_grade: ['정상A', '정상B', '경계'][Math.floor(Math.random() * 3)],
      blood_pressure: { systolic: 110 + Math.floor(Math.random() * 30), diastolic: 70 + Math.floor(Math.random() * 20) },
      blood_sugar: 85 + Math.floor(Math.random() * 30),
      bmi: 20 + Math.random() * 8,
      cholesterol: { total: 180 + Math.floor(Math.random() * 40), hdl: 50 + Math.floor(Math.random() * 20), ldl: 100 + Math.floor(Math.random() * 30) },
      liver_function: { ast: 20 + Math.floor(Math.random() * 15), alt: 20 + Math.floor(Math.random() * 15) },
      kidney_function: { creatinine: 0.8 + Math.random() * 0.4 },
      recommendations: ['규칙적인 운동 권장', '균형 잡힌 식단 유지'],
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    expiry_date: `${currentYear + 2}-03-14`,
  });

  // 건강보험료 등급
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'health',
    record_type: 'insurance_grade',
    record_date: new Date().toISOString().split('T')[0],
    data_json: {
      insurance_type: '직장가입자',
      grade: 1 + Math.floor(Math.random() * 10),
      monthly_premium: 100000 + Math.floor(Math.random() * 200000),
      dependents_count: Math.floor(Math.random() * 4),
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
  });

  // 진료 내역 (최근 1년)
  const medicalVisits = 5 + Math.floor(Math.random() * 15);
  for (let i = 0; i < medicalVisits; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const departments = ['내과', '피부과', '정형외과', '안과', '치과', '이비인후과'];
    records.push({
      user_id: userId,
      connection_id: connectionId,
      data_category: 'health',
      record_type: 'medical_visit',
      record_date: date.toISOString().split('T')[0],
      data_json: {
        visit_date: date.toISOString().split('T')[0],
        hospital_type: ['상급종합', '종합병원', '병원', '의원'][Math.floor(Math.random() * 4)],
        department: departments[Math.floor(Math.random() * departments.length)],
        diagnosis_category: '일반진료',
        copay_amount: 5000 + Math.floor(Math.random() * 50000),
      },
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
  }

  return records;
}

function generateHousingRecords(userId: string, connectionId: string): any[] {
  const records = [];
  const currentYear = new Date().getFullYear();
  const residenceTypes = ['자가', '전세', '월세'];
  const residenceType = residenceTypes[Math.floor(Math.random() * residenceTypes.length)];

  // 주민등록 초본
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'housing',
    record_type: 'resident_registration',
    record_date: new Date().toISOString().split('T')[0],
    data_json: {
      issue_date: new Date().toISOString().split('T')[0],
      current_address: '서울특별시 강남구 테헤란로 ***',
      residence_start_date: `${currentYear - Math.floor(Math.random() * 5)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-01`,
      address_changes_count: 1 + Math.floor(Math.random() * 5),
      household_members: 1 + Math.floor(Math.random() * 4),
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // 주거 형태 정보
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'housing',
    record_type: 'residence_info',
    record_date: new Date().toISOString().split('T')[0],
    data_json: {
      residence_type: residenceType,
      contract_start: `${currentYear - Math.floor(Math.random() * 3)}-01-01`,
      contract_end: residenceType !== '자가' ? `${currentYear + 1 + Math.floor(Math.random() * 2)}-12-31` : null,
      deposit: residenceType === '전세' ? 200000000 + Math.floor(Math.random() * 300000000) : 
               residenceType === '월세' ? 10000000 + Math.floor(Math.random() * 40000000) : null,
      monthly_rent: residenceType === '월세' ? 500000 + Math.floor(Math.random() * 1000000) : null,
      area_sqm: 50 + Math.floor(Math.random() * 100),
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
  });

  // 부동산 소유 정보 (자가인 경우)
  if (residenceType === '자가' || Math.random() > 0.7) {
    records.push({
      user_id: userId,
      connection_id: connectionId,
      data_category: 'housing',
      record_type: 'property_ownership',
      record_date: new Date().toISOString().split('T')[0],
      data_json: {
        property_count: 1 + Math.floor(Math.random() * 2),
        properties: [{
          type: ['아파트', '빌라', '오피스텔'][Math.floor(Math.random() * 3)],
          location: '서울특별시',
          acquisition_date: `${currentYear - 3 - Math.floor(Math.random() * 10)}-01-01`,
          estimated_value: 300000000 + Math.floor(Math.random() * 700000000),
        }],
      },
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
  }

  return records;
}

function generateEducationRecords(userId: string, connectionId: string): any[] {
  const records = [];
  const degrees = ['고등학교', '전문학사', '학사', '석사', '박사'];
  const degreeIndex = Math.floor(Math.random() * degrees.length);
  const degree = degrees[degreeIndex];
  const graduationYear = 2010 + Math.floor(Math.random() * 14);

  // 최종 학력 증명
  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'education',
    record_type: 'graduation_certificate',
    record_date: new Date().toISOString().split('T')[0],
    data_json: {
      degree_type: degree,
      institution: degree === '고등학교' ? '서울○○고등학교' : 
                   ['서울대학교', '연세대학교', '고려대학교', '한양대학교', '성균관대학교'][Math.floor(Math.random() * 5)],
      major: degree !== '고등학교' ? ['컴퓨터공학', '경영학', '경제학', '전자공학', '화학공학'][Math.floor(Math.random() * 5)] : null,
      graduation_date: `${graduationYear}-02-28`,
      graduation_status: '졸업',
      issue_date: new Date().toISOString().split('T')[0],
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    expiry_date: `${new Date().getFullYear() + 10}-12-31`,
  });

  // 성적증명서 (대학 이상인 경우)
  if (degreeIndex >= 2) {
    records.push({
      user_id: userId,
      connection_id: connectionId,
      data_category: 'education',
      record_type: 'transcript',
      record_date: new Date().toISOString().split('T')[0],
      data_json: {
        gpa: (3.0 + Math.random() * 1.5).toFixed(2),
        max_gpa: 4.5,
        total_credits: 120 + Math.floor(Math.random() * 30),
        major_gpa: (3.2 + Math.random() * 1.3).toFixed(2),
        academic_standing: ['우수', '양호', '보통'][Math.floor(Math.random() * 3)],
      },
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
  }

  return records;
}

function generateMilitaryRecords(userId: string, connectionId: string): any[] {
  const records = [];
  const serviceTypes = ['육군', '해군', '공군', '해병대', '면제', '미필'];
  const serviceType = serviceTypes[Math.floor(Math.random() * 4)]; // 대부분 복무 완료로 설정

  records.push({
    user_id: userId,
    connection_id: connectionId,
    data_category: 'military',
    record_type: 'military_service',
    record_date: new Date().toISOString().split('T')[0],
    data_json: {
      service_status: serviceType === '면제' ? '면제' : serviceType === '미필' ? '미필' : '전역',
      branch: serviceType,
      rank: serviceType !== '면제' && serviceType !== '미필' ? ['병장', '상병'][Math.floor(Math.random() * 2)] : null,
      service_start: serviceType !== '면제' && serviceType !== '미필' ? '2018-03-01' : null,
      service_end: serviceType !== '면제' && serviceType !== '미필' ? '2019-12-01' : null,
      service_type: serviceType !== '면제' && serviceType !== '미필' ? '현역' : null,
      discharge_type: serviceType !== '면제' && serviceType !== '미필' ? '만기전역' : null,
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
  });

  return records;
}

function generateCertificationRecords(userId: string, connectionId: string): any[] {
  const records: any[] = [];
  const certifications = [
    { name: '정보처리기사', category: 'IT', level: '기사' },
    { name: '빅데이터분석기사', category: 'IT', level: '기사' },
    { name: 'SQLD', category: 'IT', level: '전문' },
    { name: '한국사능력검정시험 1급', category: '어학/교양', level: '1급' },
    { name: 'TOEIC 900점 이상', category: '어학', level: '고급' },
    { name: '운전면허 1종보통', category: '운전', level: '1종' },
    { name: '공인중개사', category: '부동산', level: '전문' },
    { name: '전기기사', category: '공학', level: '기사' },
  ];

  const numCerts = 1 + Math.floor(Math.random() * 4);
  const selectedCerts = certifications.sort(() => Math.random() - 0.5).slice(0, numCerts);

  selectedCerts.forEach((cert) => {
    const acquireYear = 2015 + Math.floor(Math.random() * 9);
    records.push({
      user_id: userId,
      connection_id: connectionId,
      data_category: 'certification',
      record_type: 'national_certificate',
      record_date: `${acquireYear}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-15`,
      data_json: {
        certificate_name: cert.name,
        category: cert.category,
        level: cert.level,
        issuing_authority: cert.category === 'IT' ? '한국산업인력공단' : 
                          cert.category === '어학' ? 'ETS/한국사능력검정시험' :
                          cert.category === '운전' ? '경찰청' : '한국산업인력공단',
        issue_date: `${acquireYear}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-15`,
        expiry_date: cert.name.includes('TOEIC') ? `${acquireYear + 2}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-15` : null,
        certificate_number: `${acquireYear}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      },
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
  });

  return records;
}

// 분석 점수 계산
function calculateAnalysis(records: any[], agencyType: string): any {
  const analysisMap: Record<string, any> = {
    tax: {
      type: 'income_stability',
      calculate: (recs: any[]) => {
        const incomeRec = recs.find(r => r.record_type === 'income_certificate');
        const paymentRec = recs.find(r => r.record_type === 'tax_payment_cert');
        const income = incomeRec?.data_json?.total_income || 0;
        const grade = paymentRec?.data_json?.payment_grade || 'C';
        const gradeScoreMap: Record<string, number> = { 'A': 30, 'B': 20, 'C': 10 };
        const gradeScore = gradeScoreMap[grade] || 10;
        const incomeScore = Math.min(40, Math.floor(income / 1000000));
        const insuranceCount = recs.filter((r: any) => r.record_type === 'insurance_payment').length;
        const insuranceScore = Math.min(30, insuranceCount * 2.5);
        
        return {
          score: Math.min(100, gradeScore + incomeScore + insuranceScore),
          grade: gradeScore + incomeScore + insuranceScore >= 80 ? 'A' : 
                 gradeScore + incomeScore + insuranceScore >= 60 ? 'B' : 
                 gradeScore + incomeScore + insuranceScore >= 40 ? 'C' : 'D',
          details: {
            annual_income: income,
            tax_grade: grade,
            insurance_months: insuranceCount,
            income_percentile: Math.floor(50 + Math.random() * 40),
          },
          data_value_raw: 200,
          data_value_refined: 200 * (1 + (gradeScore + incomeScore) / 100),
        };
      },
    },
    health: {
      type: 'health_index',
      calculate: (recs: any[]) => {
        const checkup = recs.find(r => r.record_type === 'health_checkup');
        const visits = recs.filter(r => r.record_type === 'medical_visit').length;
        const overallGrade = checkup?.data_json?.overall_grade || '경계';
        const gradeScore = overallGrade.includes('정상A') ? 40 : overallGrade.includes('정상B') ? 30 : 20;
        const visitScore = Math.max(0, 30 - visits * 1.5);
        const regularCheckup = checkup ? 30 : 0;
        
        return {
          score: Math.min(100, gradeScore + visitScore + regularCheckup),
          grade: gradeScore + visitScore + regularCheckup >= 80 ? 'A' : 
                 gradeScore + visitScore + regularCheckup >= 60 ? 'B' : 'C',
          details: {
            checkup_result: overallGrade,
            annual_visits: visits,
            has_regular_checkup: !!checkup,
            health_management: visitScore > 20 ? '양호' : '보통',
          },
          data_value_raw: 150,
          data_value_refined: 150 * (1 + gradeScore / 100),
        };
      },
    },
    housing: {
      type: 'residence_stability',
      calculate: (recs: any[]) => {
        const resident = recs.find(r => r.record_type === 'resident_registration');
        const residence = recs.find(r => r.record_type === 'residence_info');
        const property = recs.find(r => r.record_type === 'property_ownership');
        
        const addressChanges = resident?.data_json?.address_changes_count || 5;
        const stabilityScore = Math.max(0, 40 - addressChanges * 5);
        const residenceType = residence?.data_json?.residence_type || '월세';
        const typeScore = residenceType === '자가' ? 40 : residenceType === '전세' ? 25 : 15;
        const propertyScore = property ? 20 : 0;
        
        return {
          score: Math.min(100, stabilityScore + typeScore + propertyScore),
          grade: stabilityScore + typeScore + propertyScore >= 80 ? 'A' : 
                 stabilityScore + typeScore + propertyScore >= 60 ? 'B' : 'C',
          details: {
            residence_type: residenceType,
            address_changes: addressChanges,
            has_property: !!property,
            stability_years: Math.max(1, 5 - addressChanges),
          },
          data_value_raw: 100,
          data_value_refined: 100 * (1 + typeScore / 100),
        };
      },
    },
    education: {
      type: 'education_level',
      calculate: (recs: any[]) => {
        const graduation = recs.find(r => r.record_type === 'graduation_certificate');
        const transcript = recs.find(r => r.record_type === 'transcript');
        
        const degreeMap: Record<string, number> = { '박사': 50, '석사': 40, '학사': 30, '전문학사': 20, '고등학교': 10 };
        const degree = graduation?.data_json?.degree_type || '고등학교';
        const degreeScore = degreeMap[degree] || 10;
        const gpa = parseFloat(transcript?.data_json?.gpa || '0');
        const gpaScore = Math.min(30, gpa * 7);
        const verifiedScore = graduation?.is_verified ? 20 : 0;
        
        return {
          score: Math.min(100, degreeScore + gpaScore + verifiedScore),
          grade: degreeScore + gpaScore + verifiedScore >= 80 ? 'A' : 
                 degreeScore + gpaScore + verifiedScore >= 60 ? 'B' : 'C',
          details: {
            highest_degree: degree,
            institution: graduation?.data_json?.institution,
            major: graduation?.data_json?.major,
            gpa: gpa || null,
          },
          data_value_raw: 80,
          data_value_refined: 80 * (1 + degreeScore / 100),
        };
      },
    },
    military: {
      type: 'military_service',
      calculate: (recs: any[]) => {
        const military = recs.find(r => r.record_type === 'military_service');
        const status = military?.data_json?.service_status || '미필';
        const statusScore = status === '전역' ? 50 : status === '면제' ? 30 : 10;
        const dischargeType = military?.data_json?.discharge_type;
        const dischargeScore = dischargeType === '만기전역' ? 30 : 15;
        const verifiedScore = military?.is_verified ? 20 : 0;
        
        return {
          score: Math.min(100, statusScore + (status === '전역' ? dischargeScore : 0) + verifiedScore),
          grade: statusScore + dischargeScore >= 70 ? 'A' : 'B',
          details: {
            service_status: status,
            branch: military?.data_json?.branch,
            discharge_type: dischargeType,
          },
          data_value_raw: 50,
          data_value_refined: 50 * (1 + statusScore / 100),
        };
      },
    },
    certification: {
      type: 'professional_qualification',
      calculate: (recs: any[]) => {
        const certs = recs.filter(r => r.record_type === 'national_certificate');
        const certCount = certs.length;
        const countScore = Math.min(50, certCount * 15);
        const levelScore = certs.some(c => c.data_json?.level === '기사') ? 30 : 
                          certs.some(c => c.data_json?.level === '전문') ? 25 : 15;
        const verifiedScore = certs.every(c => c.is_verified) ? 20 : 10;
        
        return {
          score: Math.min(100, countScore + levelScore + verifiedScore),
          grade: countScore + levelScore + verifiedScore >= 80 ? 'A' : 
                 countScore + levelScore + verifiedScore >= 60 ? 'B' : 'C',
          details: {
            total_certificates: certCount,
            certificates: certs.map(c => c.data_json?.certificate_name),
            highest_level: levelScore === 30 ? '기사' : levelScore === 25 ? '전문' : '일반',
          },
          data_value_raw: 60,
          data_value_refined: 60 * (1 + certCount * 0.2),
        };
      },
    },
  };

  const analyzer = analysisMap[agencyType];
  if (!analyzer) return null;
  
  return {
    analysis_type: analyzer.type,
    ...analyzer.calculate(records),
  };
}

// Trust Score 보너스 계산 함수
function calculateTrustScoreBonus(agencyType: string, analysisScore: number, grade: string): { score: number; vnReward: number; description: string } {
  // 카테고리별 기본 점수
  const baseScores: Record<string, number> = {
    tax: 8,        // 세금 데이터 - 경제적 신뢰도
    health: 5,     // 건강 데이터 - 자기관리
    housing: 6,    // 주거 데이터 - 안정성
    education: 5,  // 학력 데이터 - 교육 신뢰도
    military: 3,   // 병역 데이터 - 의무 이행
    certification: 4, // 자격증 - 전문성
  };

  // 등급별 보정 계수
  const gradeMultipliers: Record<string, number> = {
    'S': 2.0,
    'A': 1.5,
    'B': 1.2,
    'C': 1.0,
    'D': 0.7,
  };

  // VN 보상 기준
  const vnBaseRewards: Record<string, number> = {
    tax: 100,
    health: 80,
    housing: 70,
    education: 60,
    military: 40,
    certification: 50,
  };

  const baseScore = baseScores[agencyType] || 3;
  const multiplier = gradeMultipliers[grade] || 1.0;
  const analysisBonus = Math.floor((analysisScore / 100) * 3); // 분석 점수에 따른 추가 보너스 (최대 3점)
  
  const finalScore = Math.floor(baseScore * multiplier) + analysisBonus;
  const vnReward = Math.floor((vnBaseRewards[agencyType] || 50) * multiplier);

  const descriptions: Record<string, string> = {
    tax: '경제적 신뢰도 향상',
    health: '자기관리 지수 반영',
    housing: '주거 안정성 인증',
    education: '학력 검증 완료',
    military: '병역 의무 확인',
    certification: '전문 자격 인증',
  };

  return {
    score: finalScore,
    vnReward,
    description: descriptions[agencyType] || '정부 데이터 인증',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '인증 실패' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'get_agencies': {
        return new Response(
          JSON.stringify({ success: true, agencies: GOV_AGENCIES }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'connect': {
        const { agency_code, agency_type, agency_name } = params;
        
        // 연결 생성
        const consentExpiry = new Date();
        consentExpiry.setFullYear(consentExpiry.getFullYear() + 1);
        
        const { data: connection, error: connError } = await supabaseClient
          .from('gov_data_connections')
          .upsert({
            user_id: user.id,
            agency_type,
            agency_code,
            agency_name,
            is_connected: true,
            connected_at: new Date().toISOString(),
            sync_status: 'completed',
            last_synced_at: new Date().toISOString(),
            consent_expires_at: consentExpiry.toISOString(),
          }, { onConflict: 'user_id,agency_code' })
          .select()
          .single();

        if (connError) throw connError;

        // 데모 데이터 생성
        let records: any[] = [];
        switch (agency_type) {
          case 'tax': records = generateTaxRecords(user.id, connection.id); break;
          case 'health': records = generateHealthRecords(user.id, connection.id); break;
          case 'housing': records = generateHousingRecords(user.id, connection.id); break;
          case 'education': records = generateEducationRecords(user.id, connection.id); break;
          case 'military': records = generateMilitaryRecords(user.id, connection.id); break;
          case 'certification': records = generateCertificationRecords(user.id, connection.id); break;
        }

        // 기존 레코드 삭제 후 새로 삽입
        await supabaseClient
          .from('gov_data_records')
          .delete()
          .eq('connection_id', connection.id);

        if (records.length > 0) {
          const { error: recordsError } = await supabaseClient
            .from('gov_data_records')
            .insert(records);
          if (recordsError) console.error('Records insert error:', recordsError);
        }

        // 분석 결과 생성
        const analysis = calculateAnalysis(records, agency_type);
        if (analysis) {
          const { error: analysisError } = await supabaseClient
            .from('gov_data_analysis')
            .upsert({
              user_id: user.id,
              analysis_type: analysis.analysis_type,
              score: analysis.score,
              grade: analysis.grade,
              details_json: analysis.details,
              data_value_raw: analysis.data_value_raw,
              data_value_refined: Math.floor(analysis.data_value_refined),
              analysis_date: new Date().toISOString().split('T')[0],
            }, { onConflict: 'user_id,analysis_type' });
          if (analysisError) console.error('Analysis upsert error:', analysisError);
        }

        // Trust Score 자동 반영
        const trustScoreBonus = calculateTrustScoreBonus(agency_type, analysis?.score || 0, analysis?.grade || 'D');
        
        // 현재 프로필 조회
        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('trust_score, vn_balance')
          .eq('id', user.id)
          .single();

        if (currentProfile) {
          const newTrustScore = Math.min(100, (currentProfile.trust_score || 0) + trustScoreBonus.score);
          const vnReward = trustScoreBonus.vnReward;

          // 프로필 업데이트 (Trust Score + VN 보상)
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({
              trust_score: newTrustScore,
              vn_balance: (currentProfile.vn_balance || 0) + vnReward,
              data_last_updated: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (profileError) console.error('Profile update error:', profileError);

          // 검증 히스토리 기록
          const { error: historyError } = await supabaseClient
            .from('verification_history')
            .insert({
              user_id: user.id,
              verification_type: `gov_${agency_type}`,
              trust_score_before: currentProfile.trust_score || 0,
              trust_score_after: newTrustScore,
              score_change: trustScoreBonus.score,
              vn_earned: vnReward,
              result: {
                agency_code,
                agency_name,
                agency_type,
                analysis_score: analysis?.score,
                analysis_grade: analysis?.grade,
                data_value: analysis?.data_value_refined,
              },
            });

          if (historyError) console.error('Verification history insert error:', historyError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            connection,
            records_count: records.length,
            analysis,
            trust_score_bonus: trustScoreBonus,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_connections': {
        const { data: connections, error } = await supabaseClient
          .from('gov_data_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_connected', true)
          .order('connected_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, connections }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_records': {
        const { agency_type, record_type } = params;
        
        let query = supabaseClient
          .from('gov_data_records')
          .select('*')
          .eq('user_id', user.id);
        
        if (agency_type) query = query.eq('data_category', agency_type);
        if (record_type) query = query.eq('record_type', record_type);
        
        const { data: records, error } = await query.order('record_date', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, records }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_analysis': {
        const { data: analyses, error } = await supabaseClient
          .from('gov_data_analysis')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // 종합 분석 계산
        const totalRaw = analyses.reduce((sum, a) => sum + (a.data_value_raw || 0), 0);
        const totalRefined = analyses.reduce((sum, a) => sum + (a.data_value_refined || 0), 0);
        const avgScore = analyses.length > 0 
          ? Math.floor(analyses.reduce((sum, a) => sum + (a.score || 0), 0) / analyses.length)
          : 0;

        return new Response(
          JSON.stringify({ 
            success: true, 
            analyses,
            summary: {
              total_categories: analyses.length,
              average_score: avgScore,
              data_value_raw: totalRaw,
              data_value_refined: totalRefined,
              overall_grade: avgScore >= 80 ? 'A' : avgScore >= 60 ? 'B' : avgScore >= 40 ? 'C' : 'D',
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        const { agency_code } = params;
        
        const { error } = await supabaseClient
          .from('gov_data_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('agency_code', agency_code);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: '잘못된 요청입니다' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});