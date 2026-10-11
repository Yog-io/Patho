export const OBJECTION_SCENARIOS = {
  status_stigma: {
    category: 'Status & Social Prestige',
    parentFear: 'Mechanic / workshop work is low respect, dirty roadside garage labor. Relatives and society will look down upon our family.',
    parentFearMarathi: 'गॅरेजचे किंवा मेकॅनिकचे काम हलक्या दर्जाचे असते. समाजात आणि नातेवाईकांमध्ये प्रतिष्ठा राहणार नाही.',
    parentFearHindi: 'मैकेनिक का काम सड़क किनारे की गंदी दुकान जैसा होता है। रिश्तेदार और समाज क्या कहेंगे?',
    aiValidation: 'Your concern for your family’s honor and your child’s dignity is completely natural and deeply respected. Every parent wants their child to hold their head high.',
    aiValidationMarathi: 'आपल्या कुटुंबाच्या प्रतिष्ठेची आणि मुलाच्या सन्मानाची आपल्याला काळजी असणे अगदी स्वाभाविक आहे. प्रत्येक पालकाला आपल्या मुलाचा अभिमान वाटला पाहिजे.',
    aiValidationHindi: 'अपने परिवार के सम्मान और बच्चे के मान-सम्मान की चिंता होना स्वाभाविक है। हर माता-पिता चाहते हैं कि उनका बच्चा सिर उठाकर जिए।',
    resolutionProof: 'Rahul has NOT selected an unorganized roadside garage job. He has chosen EV Powertrain & Battery Assembly in Tata Motors / Bajaj Auto Tier-1 manufacturing plants. These are sterile, air-conditioned clean-rooms equipped with robotic diagnostic tools. He will be a certified NSQF Level 4 Technical Specialist wearing clean corporate uniforms with formal biometric plant entry, medical insurance, and PF benefits—earning more than standard office clerks.',
    resolutionProofMarathi: 'राहुलनं रस्त्यावरच्या गॅरेजचं काम निवडलेलं नाही. त्याने टाटा मोटर्स आणि बजाज ऑटोसारख्या आधुनिक कारखान्यांमधील EV बॅटरी असेंब्लीचं काम निवडलं आहे. या लॅब पूर्णपणे वातानुकूलित, स्वच्छ आणि रोबोटिक तंत्रज्ञानाने सज्ज असतात. तो गणवेशात, आयकार्ड आणि पीएफ-विम्यासह कॉर्पोरेट तंत्रज्ञ म्हणून काम करेल.',
    resolutionProofHindi: 'राहुल ने किसी सड़क किनारे के गैरेज का काम नहीं चुना है। उसने टाटा मोटर्स और बजाज ऑटो जैसे कॉर्पोरेट प्लांट्स में ईवी बैटरी असेंबली चुनी है। ये प्लांट्स पूरी तरह साफ-सुथरे, एसी और रोबोटिक तकनीक से युक्त होते हैं। वह पूरे सम्मान के साथ सरकारी प्रमाण पत्र और कंपनी आईडी कार्ड के साथ काम करेगा।'
  },
  salary_gap: {
    category: 'Immediate Earning & Minimum Salary Threshold',
    parentFear: 'We need him earning at least ₹18,000 to ₹20,000/month within 1-2 years to support our household expenses.',
    parentFearMarathi: 'घराचा खर्च भागवण्यासाठी त्याला १ ते २ वर्षात किमान १८,००० ते २०,००० रुपये महिना मिळायलाच हवा.',
    parentFearHindi: 'घर की जिम्मेदारी संभालने के लिए उसे १-२ साल में कम से कम १८,००० से २०,००० रुपये महीना कमाना ही होगा।',
    aiValidation: 'You carry real household responsibilities, and financial stability is non-negotiable. We will not compromise on your target.',
    resolutionProof: 'Under the National Apprenticeship Promotion Scheme (NAPS), Rahul begins earning a direct DBT government-backed stipend of ₹12,000/month right from day 1 of training—eliminating any financial burden on your household. Upon 12-month certification, entry salaries in the Chakan/Bhosari corridor start at ₹21,000/month, directly surpassing your ₹18,000 expectation.',
    microCredentialBooster: {
      title: 'Integrated High-Voltage EV Safety & CNC Diagnostics Micro-Credential (6 Months)',
      wageBoost: '+ ₹4,000 / month',
      stipendDuringTraining: '₹12,000 / month (Paid by NAPS & Corporate Partner)',
      projectedYear1Wage: '₹22,500 - ₹25,000 / month',
      explanation: 'By bundling this 6-month micro-certification alongside standard training, Rahul moves from basic assembly to specialized battery diagnostics, raising his guaranteed package well above ₹22,000.'
    }
  },
  workplace_safety: {
    category: 'Workplace Safety & Physical Hazard',
    parentFear: 'Factory machines are dangerous. What if there is an accident or injury on the shop floor?',
    parentFearMarathi: 'कारखान्यातील मशीन धोकादायक असतात. तिथे अपघात किंवा दुखापत झाली तर काय?',
    parentFearHindi: 'फैक्ट्री में बड़ी मशीनें खतरनाक होती हैं। अगर कोई दुर्घटना हो गई तो क्या होगा?',
    aiValidation: 'A parent’s worry about their child’s physical safety is supreme. No amount of money is worth putting a child in danger.',
    resolutionProof: 'EV Battery assembly lines adhere to strict international ISO 26262 and OSHA electrical safety standards. Technicians operate inside insulated ESD-safe workstations with automatic laser shutoff barriers, personal protective equipment (PPE), and zero contact with raw high voltages during assembly. Every trainee is covered by mandatory Employee State Insurance (ESIC) and Group Accidental Policy from day one.'
  },
  higher_education_degree: {
    category: 'College Degree & Long-Term Growth Ceiling',
    parentFear: 'Without a college degree, his career will hit a dead end after a few years.',
    parentFearMarathi: 'कॉलेजची पदवी (डिग्री) नसेल तर काही वर्षानंतर त्याची प्रगती थांबेल का?',
    parentFearHindi: 'कॉलेज की डिग्री के बिना कुछ साल बाद उसकी तरक्की रुक तो नहीं जाएगी?',
    aiValidation: 'You want your child to have long-term leadership opportunities, not just a temporary job.',
    resolutionProof: 'Under India’s National Credit Framework (NCrF 2023), Rahul’s NSQF Level 4 qualification earns him 40 national academic credits. He does NOT need to repeat 11th and 12th! He gains direct lateral entry into the 2nd year of a Bachelor of Vocation (B.Voc) in Automotive Technology or Polytechnic Diploma. He can earn an authorized university degree while drawing a full-time company salary!'
  }
};
