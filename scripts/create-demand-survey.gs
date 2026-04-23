/**
 * ============================================================================
 * Verinode 개인 공급자 수요 검증 설문 v1 - Google Forms 자동 생성기
 * ============================================================================
 *
 * 이 파일은 Google Apps Script 코드입니다.
 * Google Drive 계정 권한으로 Google Forms를 자동 생성합니다.
 *
 * ─── 사용법 ─────────────────────────────────────────────────
 * 1. https://script.google.com 접속 (Google 계정 로그인)
 * 2. 좌측 상단 [+ 새 프로젝트] 클릭
 * 3. 기본 코드(function myFunction() {})를 삭제
 * 4. 이 파일 내용 전체를 복사해서 붙여넣기
 * 5. Ctrl+S (저장) — 프로젝트 이름은 아무거나 (예: verinode-survey)
 * 6. 상단 함수 선택 드롭다운에서 "createVerinodeSurvey" 확인
 * 7. [실행] (▶ 버튼) 클릭
 * 8. 처음이면 권한 요청 팝업 → [권한 검토] → Google 계정 선택 →
 *    "Google에서 확인되지 않은 앱" 경고 → [고급] → [프로젝트 이름(으)로 이동]
 *    → [허용]
 * 9. 실행 완료 후 하단 "실행 로그"에 Form URL 표시됨
 *
 * ─── 결과 ───────────────────────────────────────────────────
 * ✅ 응답받을 URL (공유용):  https://forms.gle/xxxxxxxx
 * ✏️ 편집 URL (본인 전용):    https://docs.google.com/forms/d/xxxxxx/edit
 *
 * 공유용 URL을 카카오 오픈채팅·지인 DM에 뿌리면 됩니다.
 * ============================================================================
 */

function createVerinodeSurvey() {
  const form = FormApp.create('내 데이터에 정당한 대가, 받으실 의향 있으신가요?');

  form.setDescription(
    '안녕하세요. verinode를 준비하고 있는 사람입니다.\n\n' +
    '기업은 매일 우리의 데이터로 돈을 법니다.\n' +
    '하지만 정작 데이터의 주인인 우리는 아무 것도 받지 못합니다.\n' +
    'verinode는 이것을 바꾸려고 합니다.\n\n' +
    '정부가 인증한 "진짜 나의 데이터"를 기업이 사 가고,\n' +
    '그 대가의 대부분을 데이터 주인인 당신에게 돌려드립니다.\n\n' +
    '이 설문은 5~6분이면 끝납니다.\n' +
    '응답해 주신 분께는 정식 출시 시 첫 설문 보너스 1,000원을 드립니다.'
  );

  // ── 기본 설정 ──────────────────────────────────────────────
  form.setCollectEmail(false);              // 로그인 강제 X (응답률 우선)
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(true);                // 진행률 표시 = 완주율 증가
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);   // 로그인 요구 안 함

  // ==========================================================================
  // 페이지 2 — 본인 소개 (4문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('먼저 간단히 말씀 부탁드려요');

  form.addMultipleChoiceItem()
    .setTitle('1. 성별')
    .setRequired(true)
    .setChoiceValues(['남성', '여성', '응답 안 함']);

  form.addMultipleChoiceItem()
    .setTitle('2. 연령대')
    .setRequired(true)
    .setChoiceValues(['10대', '20대', '30대', '40대', '50대', '60대 이상']);

  const q3 = form.addMultipleChoiceItem()
    .setTitle('3. 현재 직업 상태')
    .setRequired(true);
  q3.setChoices([
    q3.createChoice('학생'),
    q3.createChoice('직장인'),
    q3.createChoice('프리랜서·1인 사업자'),
    q3.createChoice('자영업자'),
    q3.createChoice('주부'),
    q3.createChoice('무직·구직 중')
  ]);
  q3.showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('4. 주로 생활하시는 지역')
    .setRequired(true)
    .setChoiceValues([
      '서울',
      '경기·인천',
      '광역시 (부산·대구·대전·광주·울산)',
      '그 외 지방'
    ]);

  // ==========================================================================
  // 페이지 3 — 최근 행동 (Mom Test 핵심) (3문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('최근에 이런 경험 있으셨어요?');

  form.addMultipleChoiceItem()
    .setTitle('5. 지난 한 달 동안 온라인 설문(패널사이트·리서치앱 등)에 몇 번이나 응답하셨나요?')
    .setRequired(true)
    .setChoiceValues(['0번', '1~3번', '4~10번', '11번 이상', '정확히 기억 안 남']);

  form.addMultipleChoiceItem()
    .setTitle('6. 가장 마지막에 참여한 설문에서 받으신 보상은 어느 정도였나요?')
    .setRequired(true)
    .setChoiceValues([
      '아무것도 받지 못함',
      '1,000원 이하 (포인트·쿠폰 소액 포함)',
      '1,000~3,000원',
      '3,000~5,000원',
      '5,000원 이상',
      '설문 경험이 아예 없음'
    ]);

  form.addParagraphTextItem()
    .setTitle('7. 응답 중간에 포기하고 닫아버린 적이 있으시면, 가장 큰 이유가 뭐였나요?')
    .setHelpText('예: 질문이 너무 많아서, 개인정보가 이상하게 물어봐서, 보상이 적어서, 말이 이상해서 등')
    .setRequired(false);

  // ==========================================================================
  // 페이지 4 — 마이데이터 경험 (3문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('\'마이데이터\', 얼마나 알고 계세요?');

  form.addMultipleChoiceItem()
    .setTitle('8. "마이데이터"라는 용어를 들어본 적 있으신가요?')
    .setRequired(true)
    .setChoiceValues(['잘 알고 있다', '들어는 봤다', '처음 듣는다']);

  form.addMultipleChoiceItem()
    .setTitle('9. 실제로 마이데이터 서비스를 사용해 보신 경험이 있으세요? (뱅크샐러드·토스 자산조회·정부24 MyData·KB 마이데이터 등)')
    .setRequired(true)
    .setChoiceValues(['있다', '없다']);

  form.addParagraphTextItem()
    .setTitle('10. (9번에서 "있다"고 답하신 분만) 사용하면서 가장 불편했던 점 하나만 꼽아 주세요.')
    .setRequired(false);

  // ==========================================================================
  // 페이지 5 — verinode 소개 (1문항 + 이탈 분기)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('verinode는 이렇게 작동합니다')
    .setHelpText(
      '1단계 (한 번만, 5분):\n' +
      '  정부24·은행 등에서 마이데이터 동의로 "진짜 당신의 데이터"를 인증합니다.\n' +
      '  verinode는 당신이 허락한 범위 안에서만 사용합니다.\n\n' +
      '2단계 (매번):\n' +
      '  기업이 "검증된 당신의 의견"을 원하면 설문이 도착합니다.\n' +
      '  응답 1건당 약 5,000원.\n' +
      '  한 달에 10건 정도 꾸준히 답하면 월 5만원 정도가 쌓입니다.\n\n' +
      '3단계:\n' +
      '  적립된 돈은 언제든 출금. 공짜로 가져가는 기업은 없습니다.'
    );

  form.addMultipleChoiceItem()
    .setTitle('11. 지금 들으신 이 서비스에 관심이 가시나요?')
    .setRequired(true)
    .setChoiceValues([
      '적극 참여하고 싶다',
      '조건이 맞으면 참여하겠다',
      '잘 모르겠다',
      '관심 없다'
    ]);

  form.addParagraphTextItem()
    .setTitle('12. (11번에서 "관심 없다"를 선택하셨다면) 가장 큰 이유가 뭔가요?')
    .setRequired(false);

  // ==========================================================================
  // 페이지 6 — 구체적 조건 (가격·마찰 검증) (3문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('좀 더 구체적으로');

  form.addMultipleChoiceItem()
    .setTitle('13. 설문 1건당 보상이 얼마부터 참여할 의사가 생기시나요?')
    .setRequired(true)
    .setChoiceValues([
      '1,000원이라도 참여',
      '3,000원은 돼야',
      '5,000원은 돼야',
      '7,000원 이상이어야',
      '금액과 상관없이 안 할 것 같다'
    ]);

  const q14 = form.addMultipleChoiceItem()
    .setTitle('14. 처음 한 번, 마이데이터 동의 과정에 5분 정도 들이는 것은 어떠세요?')
    .setRequired(true);
  q14.setChoices([
    q14.createChoice('5분 정도면 괜찮다'),
    q14.createChoice('3분 이내여야 한다'),
    q14.createChoice('번거로워서 시작조차 안 할 것 같다')
  ]);
  q14.showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('15. 한 달에 몇 건 정도의 설문이 들어오면 적당할까요?')
    .setRequired(true)
    .setChoiceValues([
      '건수 상관없이 언제든 오면 좋다',
      '월 5건 이하',
      '월 6~15건',
      '월 16건 이상은 부담',
      '건수 자체가 중요하지 않다'
    ]);

  // ==========================================================================
  // 페이지 7 — 걱정·저항 요인 (2문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('이 서비스, 무엇이 가장 걸리세요?');

  const q16 = form.addCheckboxItem()
    .setTitle('16. verinode 사용을 망설이게 할 수 있는 걱정을 모두 골라주세요.')
    .setRequired(true);
  q16.setChoices([
    q16.createChoice('개인정보 유출이 불안하다'),
    q16.createChoice('기업이 내 데이터로 뭘 할지 모르겠다'),
    q16.createChoice('약속한 돈을 진짜 받을 수 있을지 의심된다'),
    q16.createChoice('인증 과정이 복잡할 것 같다'),
    q16.createChoice('너무 많은 설문이 스팸처럼 올까 봐 걱정된다'),
    q16.createChoice('시간 대비 보상이 적을 것 같다'),
    q16.createChoice('특별히 걱정 없다')
  ]);
  q16.showOtherOption(true);

  form.addParagraphTextItem()
    .setTitle('17. 단 하나만 해결된다면 바로 시작하실 것 같은 걱정은 뭔가요?')
    .setRequired(false);

  // ==========================================================================
  // 페이지 8 — 커밋먼트 (핵심 signal: 이메일 등록률) (2문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('정식 출시 때 가장 먼저 알림 받고 싶으신가요?')
    .setHelpText(
      '스팸은 절대 보내지 않습니다.\n' +
      '출시 공지 딱 1건, 그리고 첫 설문 보너스 1,000원 안내만 드립니다.'
    );

  form.addTextItem()
    .setTitle('18. 출시 알림·첫 보너스를 받고 싶으시면 이메일을 남겨주세요.')
    .setHelpText('⚠️ 이 응답이 "진짜 수요 있음" 판정의 핵심 지표입니다.')
    .setValidation(
      FormApp.createTextValidation()
        .requireTextIsEmail()
        .setHelpText('올바른 이메일 형식이 아닙니다.')
        .build()
    )
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('19. 주변에 관심 있을 만한 분께 이 설문을 공유해 주시겠어요?')
    .setRequired(false)
    .setChoiceValues(['예, 공유하겠다', '아니오']);

  // ==========================================================================
  // 페이지 9 — 자유 의견 (2문항)
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('마지막으로 자유롭게');

  form.addParagraphTextItem()
    .setTitle('20. verinode에 꼭 있어야 한다고 생각하시는 기능이나, 저희가 놓치고 있는 게 있으면 알려주세요.')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('21. 이 설문 자체에 대한 피드백도 환영합니다. 이해 안 되는 질문, 빠진 선택지 등.')
    .setRequired(false);

  // ==========================================================================
  // 페이지 10 — 감사 인사
  // ==========================================================================
  form.addPageBreakItem()
    .setTitle('고맙습니다')
    .setHelpText(
      '이메일을 남겨주신 분께는\n' +
      '정식 출시 때 초대장 + 첫 설문 보너스 1,000원을 가장 먼저 보내드리겠습니다.\n\n' +
      'verinode는 "누구도 공짜로 가져가지 않는다"가 원칙입니다.\n' +
      '당신이 답해 주신 이 5분도, 출시 이후 보너스로 돌려드리겠습니다.\n\n' +
      '- verinode 팀 드림'
    );

  // ── 완료 - URL 출력 ────────────────────────────────────────
  const publishedUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();
  let shortUrl;
  try {
    shortUrl = form.shortenFormUrl(publishedUrl);
  } catch (e) {
    shortUrl = publishedUrl;
  }

  Logger.log('=========================================');
  Logger.log('✅ Verinode 수요 검증 설문 생성 완료!');
  Logger.log('=========================================');
  Logger.log('');
  Logger.log('📋 응답 URL (카카오·DM 공유용):');
  Logger.log(shortUrl);
  Logger.log('');
  Logger.log('✏️ 편집 URL (본인 전용):');
  Logger.log(editUrl);
  Logger.log('');
  Logger.log('=========================================');
  Logger.log('Google Drive에도 Form 파일이 자동 저장됨.');
  Logger.log('https://drive.google.com 에서 확인 가능.');
  Logger.log('=========================================');
}
