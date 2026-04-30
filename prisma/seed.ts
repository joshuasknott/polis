import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "alex.chen@university.ac.uk" },
    update: {},
    create: {
      id: "u_01",
      name: "Alex Chen",
      email: "alex.chen@university.ac.uk",
      passwordHash,
      university: "University of Edinburgh",
      course: "Politics and International Relations",
      yearOfStudy: 3,
      role: "student",
    },
  });

  console.log(`Created user: ${user.name}`);

  const modules = [
    {
      id: "mod_01",
      code: "PIRR30041",
      title: "International Security",
      description:
        "Examines the changing nature of international security, including great power competition, nuclear deterrence, cyber threats, and human security.",
      academicYear: "2025-26",
      semester: "Semester 1",
      colour: "#1e3a5f",
    },
    {
      id: "mod_02",
      code: "PIRR30022",
      title: "Comparative Government and Politics",
      description:
        "Compares democratic systems across countries, examining electoral systems, executive-legislative relations, federalism, and governance outcomes.",
      academicYear: "2025-26",
      semester: "Semester 1",
      colour: "#4a6741",
    },
    {
      id: "mod_03",
      code: "PIRR30055",
      title: "Elections and Voters",
      description:
        "Analyses electoral systems, voting behaviour, party competition, and the role of media and identity in shaping democratic choice.",
      academicYear: "2025-26",
      semester: "Semester 2",
      colour: "#7c3aed",
    },
    {
      id: "mod_04",
      code: "SSPS30010",
      title: "Research Methods",
      description:
        "Introduces qualitative and quantitative research methods for social science, including case study design, survey analysis, and ethical research practice.",
      academicYear: "2025-26",
      semester: "Semester 2",
      colour: "#b45309",
    },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: {},
      create: { ...mod, userId: user.id },
    });
  }
  console.log(`Created ${modules.length} modules`);

  const folderDefs = [
    { name: "Module Info", type: "module_info", displayOrder: 0 },
    { name: "Readings", type: "readings", displayOrder: 1 },
    { name: "Lecture and Seminar Material", type: "lectures", displayOrder: 2 },
    { name: "Source Notes", type: "source_notes", displayOrder: 3 },
    { name: "Essay Plans", type: "essay_plans", displayOrder: 4 },
    { name: "Drafts and Feedback", type: "drafts", displayOrder: 5 },
    { name: "Final Submission", type: "final_submission", displayOrder: 6 },
  ];

  let folderIdx = 0;
  const folderMap: Record<string, string> = {};

  for (const mod of modules) {
    for (const fd of folderDefs) {
      const folder = await prisma.folder.create({
        data: {
          id: `f_${String(folderIdx + 1).padStart(2, "0")}`,
          moduleId: mod.id,
          name: fd.name,
          type: fd.type,
          displayOrder: fd.displayOrder,
        },
      });
      folderMap[`${mod.id}-${fd.type}`] = folder.id;
      folderIdx++;
    }
  }
  console.log(`Created ${folderIdx} folders`);

  const sources = [
    {
      id: "src_01",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-readings"],
      title: "Patterns of Democracy: Government Forms and Performance in Thirty-Six Countries",
      authors: "Arend Lijphart",
      year: 1999,
      type: "book_chapter",
      summary:
        "Lijphart presents a comprehensive comparison of consensus and majoritarian democracy models across 36 countries, arguing that consensus democracies outperform majoritarian ones on measures of democratic quality, power sharing, and policy moderation.",
      keyArguments:
        "Consensus democracy, characterised by power-sharing, proportional representation, and multi-party systems, produces better democratic outcomes than majoritarian systems across multiple quality-of-democracy indicators.",
      concepts:
        "consensus democracy, majoritarian democracy, power-sharing, proportional representation, executive-legislative balance, federalism vs unitarism",
      status: "ready",
      wordCount: 14400,
    },
    {
      id: "src_02",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-readings"],
      title: "Veto Players: How Political Institutions Work",
      authors: "George Tsebelis",
      year: 2002,
      type: "book_chapter",
      summary:
        "Tsebelis develops a veto player theory of political institutions, arguing that the number and ideological distance between veto players determines policy stability and the range of feasible policy change.",
      keyArguments:
        "More veto players with greater ideological distance between them leads to greater policy stability and narrower ranges of policy change, regardless of whether the system is formally consensual or majoritarian.",
      concepts:
        "veto players, absorbed veto players, institutional veto players, partisan veto players, policy stability, winset",
      status: "ready",
      wordCount: 18600,
    },
    {
      id: "src_03",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-readings"],
      title: "The Rise and Fall of Consensus Democracy in Western Europe, 1945-2019",
      authors: "Matt Qvortrup",
      year: 2022,
      type: "journal_article",
      summary:
        "Qvortrup traces the trajectory of consensus democracy in Western Europe, arguing that while Lijphart's models were accurate for the post-war period, rising populism and polarisation have eroded consensus practices even in traditionally consensual systems.",
      keyArguments:
        "Consensus democracy in Western Europe has been in decline since the early 2000s, challenged by populist movements, party system fragmentation, and declining trust in institutional mediation.",
      concepts: "consensus democracy decline, populism, party fragmentation, institutional trust, Lijphart revisited",
      status: "ready",
      wordCount: 5400,
    },
    {
      id: "src_04",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-lectures"],
      title: "Week 4 Lecture: Comparing Westminster and Consensus Models",
      authors: "Dr. Sarah Mitchell",
      year: 2026,
      type: "lecture_slides",
      summary:
        "Lecture comparing the Westminster majoritarian model with Lijphart's consensus model, using the UK and the Netherlands as primary case studies.",
      keyArguments:
        "While the UK Westminster system is the archetypal majoritarian model, its departure from pure majoritarianism in devolved nations illustrates the practical complexity of these categories.",
      concepts: "Westminster model, devolution, first-past-the-post, coalition government, bicameralism",
      status: "ready",
      wordCount: 9600,
    },
    {
      id: "src_05",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-essay_plans"],
      title: "Essay Brief: Majoritarianism vs Consensus Democracy",
      authors: "Course Convenor",
      year: 2026,
      type: "essay_brief",
      summary:
        "Essay assessment asking students to compare majoritarian and consensus democratic systems, evaluating which better delivers effective government and policy-making.",
      keyArguments: "N/A - assessment document",
      concepts: "essay question, assessment criteria, majoritarianism, consensus democracy",
      status: "ready",
      wordCount: 900,
    },
    {
      id: "src_06",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-module_info"],
      title: "PIRR30022 Marking Rubric",
      authors: "Course Convenor",
      year: 2026,
      type: "marking_rubric",
      summary:
        "Marking criteria for PIRR30022 essays covering argument clarity, theoretical understanding, use of evidence, structure, critical analysis, and referencing.",
      keyArguments: "N/A - rubric document",
      concepts: "marking criteria, argument clarity, theoretical understanding, evidence use, critical analysis",
      status: "ready",
      wordCount: 600,
    },
    {
      id: "src_07",
      moduleId: "mod_01",
      folderId: folderMap["mod_01-readings"],
      title: "The Return of Great Power Politics",
      authors: "Christopher Layne",
      year: 2018,
      type: "journal_article",
      summary:
        "Layne argues that the return of great power rivalry between the US, China, and Russia represents a fundamental shift in international security, driven by structural realism rather than individual leadership choices.",
      keyArguments:
        "Great power competition is returning due to structural shifts in the international system, particularly the relative decline of US hegemony and the rise of China, not because of specific leaders or decisions.",
      concepts: "great power competition, structural realism, US hegemony, China rise, multipolarity, offensive realism",
      status: "ready",
      wordCount: 4800,
    },
    {
      id: "src_08",
      moduleId: "mod_01",
      folderId: folderMap["mod_01-readings"],
      title: "Nuclear Deterrence in a New Era: Challenges and Adaptations",
      authors: "Keir Lieber & Daryl Press",
      year: 2020,
      type: "journal_article",
      summary:
        "Examines how emerging technologies and shifting great power dynamics challenge traditional nuclear deterrence frameworks, arguing that the risk of escalation is growing in ways that Cold War deterrence theory did not anticipate.",
      keyArguments:
        "Advances in precision conventional weapons, cyber capabilities, and missile defence are undermining the stability of mutual assured destruction, requiring new deterrence thinking.",
      concepts: "nuclear deterrence, MAD, conventional precision strike, cyber-nuclear nexus, escalation, strategic stability",
      status: "ready",
      wordCount: 12600,
    },
    {
      id: "src_09",
      moduleId: "mod_01",
      folderId: folderMap["mod_01-lectures"],
      title: "Week 6 Lecture: Great Power Competition and Global Order",
      authors: "Prof. James Richardson",
      year: 2026,
      type: "lecture_slides",
      summary:
        "Lecture examining how the return of great power competition is reshaping global security institutions, alliances, and norms.",
      keyArguments:
        "The post-Cold War liberal international order is being contested by revisionist powers, but complete system change is unlikely; hybrid contestation is the more probable outcome.",
      concepts: "liberal international order, revisionist powers, hybrid contestation, alliance politics, institutional adaptation",
      status: "ready",
      wordCount: 8400,
    },
    {
      id: "src_10",
      moduleId: "mod_03",
      folderId: folderMap["mod_03-module_info"],
      title: "The American Voter Revisited",
      authors: "Lewis-Beck et al.",
      year: 2008,
      type: "book",
      summary:
        "Revisits the seminal Michigan model of voting behaviour, updating the party identification framework with contemporary data on issue voting, economic voting, and the role of media.",
      keyArguments:
        "Party identification remains the strongest predictor of vote choice, but its stability has declined as issue salience, economic conditions, and media environments have become more variable.",
      concepts: "party identification, Michigan model, issue voting, economic voting, media effects",
      status: "ready",
      wordCount: 13500,
    },
    {
      id: "src_11",
      moduleId: "mod_04",
      folderId: folderMap["mod_04-module_info"],
      title: "Case Study Research: Principles and Practices",
      authors: "John Gerring",
      year: 2017,
      type: "book_chapter",
      summary:
        "Provides a rigorous framework for case study research in social science, defining what constitutes a case study, when it is appropriate, and how to ensure methodological rigour.",
      keyArguments:
        "Case study research, when properly designed with clear case selection rationale and within-case causal analysis, can produce findings as rigorous and generalisable as large-N quantitative studies.",
      concepts: "case selection, within-case analysis, causal inference, most-likely case, least-likely case, methodological rigour",
      status: "ready",
      wordCount: 9000,
    },
    {
      id: "src_12",
      moduleId: "mod_02",
      folderId: folderMap["mod_02-drafts"],
      title: "Essay Draft 1: Majoritarian vs Consensus Democracy",
      authors: "Alex Chen",
      year: 2026,
      type: "draft",
      summary: "First draft of comparative politics essay examining majoritarian and consensus democratic systems.",
      keyArguments: "Student draft - argues that consensus democracies produce more effective policy outcomes overall.",
      concepts: "student draft, essay, majoritarianism, consensus democracy",
      status: "ready",
      wordCount: 2400,
    },
  ];

  for (const src of sources) {
    await prisma.source.upsert({
      where: { id: src.id },
      update: {},
      create: {
        ...src,
        userId: user.id,
      },
    });
  }
  console.log(`Created ${sources.length} sources`);

  const sampleChunks = [
    {
      sourceId: "src_01",
      chunkIndex: 0,
      text: "Consensus democracy is characterised by power-sharing, bargaining, and compromise rather than the concentration and exercise of power by a simple majority. Lijphart identifies two dimensions: the executives-parties dimension and the federal-unitary dimension. On the executives-parties dimension, consensus democracies tend to have multi-party systems, proportional representation, coalition cabinets, and balanced executive-legislative relations. The federal-unitary dimension encompasses federalism, bicameralism, rigid constitutions, judicial review, and independent central banks. Across 36 democracies examined over the period 1945-1996, Lijphart finds that consensus democracies consistently outperform majoritarian ones on measures of democratic quality, including women's representation, political equality, voter turnout, and satisfaction with democracy.",
      charCount: 780,
      tokenEstimate: 195,
    },
    {
      sourceId: "src_01",
      chunkIndex: 1,
      text: "On the dimension of democratic quality, consensus democracy has a clear edge over majoritarian democracy. The evidence shows that consensus democracies have higher voter turnout, greater political equality, better representation of women and minorities, and higher citizen satisfaction with the democratic process. Lijphart argues that these advantages stem from the inclusive nature of consensus institutions, which give more citizens a voice in governance. The majoritarian model, by contrast, excels primarily in decisiveness - the ability to make and implement decisions quickly. However, this decisiveness comes at the cost of excluding large minorities from meaningful political participation.",
      charCount: 680,
      tokenEstimate: 170,
    },
    {
      sourceId: "src_02",
      chunkIndex: 0,
      text: "The more veto players there are, and the greater the ideological distance between them, the more policy stability we should expect. Tsebelis defines veto players as individual or collective actors whose agreement is necessary for a change in policy. These can be institutional (such as a president, a second chamber, or a supreme court) or partisan (such as coalition partners in a multiparty government). The key insight is that policy stability increases not just with the number of veto players, but with the ideological distance between them. When veto players are far apart ideologically, the winset - the set of policies that can defeat the status quo - shrinks, making policy change more difficult.",
      charCount: 745,
      tokenEstimate: 186,
    },
    {
      sourceId: "src_03",
      chunkIndex: 0,
      text: "Consensus democracy in Western Europe has been in decline since the early 2000s, challenged by populist movements, party system fragmentation, and declining trust in institutional mediation. Qvortrup traces how the post-war consensus model, once the dominant approach in countries like the Netherlands, Belgium, and Switzerland, has been eroded by the rise of anti-establishment parties, the decline of traditional party structures, and increasing voter volatility. While formal institutions remain largely unchanged, the practice of consensus politics has weakened considerably. The author argues that this decline has implications not only for the countries directly affected, but for the broader theoretical framework established by Lijphart.",
      charCount: 730,
      tokenEstimate: 182,
    },
    {
      sourceId: "src_07",
      chunkIndex: 0,
      text: "The return of great power politics is not a choice but a structural inevitability of the changing distribution of power in the international system. Layne argues that the unipolar moment of US dominance following the Cold War was always temporary, and that the structural dynamics of the international system - particularly the rise of China as a peer competitor and the resurgence of Russia - have made great power competition inevitable once again. This competition is not driven by the personalities or preferences of individual leaders, but by the fundamental logic of balance of power politics. The implications for international security are profound, as great power rivalry increases the risk of confrontation, proxy conflicts, and arms races across multiple domains.",
      charCount: 780,
      tokenEstimate: 195,
    },
    {
      sourceId: "src_08",
      chunkIndex: 0,
      text: "The stability-instability paradox that governed Cold War nuclear dynamics may not hold in an era of precision conventional weapons and cyber vulnerabilities. Lieber and Press examine how advances in precision-guided munitions, cyber warfare capabilities, and missile defence systems are undermining the foundations of mutual assured destruction. They argue that these new technologies create incentives for first strikes and escalation, as each side fears that its nuclear deterrent could be degraded or destroyed before it can be used. The resulting instability is qualitatively different from Cold War dynamics and requires new frameworks for understanding nuclear deterrence in the 21st century.",
      charCount: 735,
      tokenEstimate: 183,
    },
  ];

  for (const chunk of sampleChunks) {
    await prisma.sourceChunk.create({ data: chunk });
  }
  console.log(`Created ${sampleChunks.length} sample chunks`);

  const essay = await prisma.essay.upsert({
    where: { id: "essay_01" },
    update: {},
    create: {
      id: "essay_01",
      userId: user.id,
      moduleId: "mod_02",
      title: "Majoritarianism vs Consensus Democracy",
      question:
        "Compare majoritarian with consensus democracies: which system better delivers effective government and effective policy-making?",
      thesis:
        "While majoritarian democracies offer greater decisiveness, consensus democracies produce more durable, legitimate, and broadly effective policy outcomes - though this advantage is increasingly challenged by populist pressures and institutional erosion.",
      targetWordCount: 3000,
      status: "drafting",
    },
  });
  console.log(`Created essay: ${essay.title}`);

  const sections = [
    {
      id: "sec_01",
      essayId: "essay_01",
      title: "Introduction",
      purpose: "Define majoritarian and consensus democracy, introduce policy effectiveness question, state thesis",
      targetWordCount: 300,
      displayOrder: 0,
      notes:
        '["Define majoritarian and consensus democracy using Lijphart\'s typology","Introduce the policy effectiveness question","State thesis: consensus democracies produce more durable and effective policy outcomes, though with trade-offs in decisiveness"]',
    },
    {
      id: "sec_02",
      essayId: "essay_01",
      title: "Theoretical Framework: Lijphart and Tsebelis",
      purpose: "Outline theoretical framework",
      targetWordCount: 600,
      displayOrder: 1,
      notes:
        '["Outline Lijphart\'s consensus-majoritarian dimension","Introduce Tsebelis\'s veto player theory as a complementary mechanism","Explain how veto player theory explains policy stability in consensus systems"]',
    },
    {
      id: "sec_03",
      essayId: "essay_01",
      title: "Policy Effectiveness in Consensus Democracies",
      purpose: "Present evidence for consensus democracy effectiveness",
      targetWordCount: 700,
      displayOrder: 2,
      notes:
        '["Lijphart\'s evidence on democratic quality indicators","Policy durability and legitimacy in power-sharing systems","Case study: Netherlands or Germany"]',
    },
    {
      id: "sec_04",
      essayId: "essay_01",
      title: "Policy Effectiveness in Majoritarian Democracies",
      purpose: "Present the majoritarian advantage",
      targetWordCount: 600,
      displayOrder: 3,
      notes:
        '["Decisiveness as a majoritarian advantage","Policy volatility and the \'electoral despotism\' critique","Case study: UK under Westminster model"]',
    },
    {
      id: "sec_05",
      essayId: "essay_01",
      title: "Critical Assessment",
      purpose: "Critically assess both models",
      targetWordCount: 500,
      displayOrder: 4,
      notes:
        '["Can the two models be clearly distinguished in practice?","Qvortrup\'s argument about the decline of consensus democracy","Hybrid systems and the limitations of the typology"]',
    },
    {
      id: "sec_06",
      essayId: "essay_01",
      title: "Conclusion",
      purpose: "Summarise and conclude",
      targetWordCount: 300,
      displayOrder: 5,
      notes:
        '["Summarise the comparative evidence","Acknowledge trade-offs between decisiveness and durability","Suggest that the question of \'better\' depends on the valued outcome"]',
    },
  ];

  for (const sec of sections) {
    await prisma.essaySection.upsert({
      where: { id: sec.id },
      update: {},
      create: sec,
    });
  }
  console.log(`Created ${sections.length} essay sections`);

  const evidenceItems = [
    {
      id: "ev_01",
      essayId: "essay_01",
      sectionId: "sec_01",
      sourceId: "src_01",
      claim: "Consensus democracy definition",
      evidenceText:
        "Consensus democracy is characterised by power-sharing, bargaining, and compromise rather than the concentration and exercise of power by a simple majority.",
      explanation: "Establishing Lijphart's typology and its core characteristics",
      citation: "Lijphart (1999, pp. 2-3)",
      tags: "typology,definition",
    },
    {
      id: "ev_02",
      essayId: "essay_01",
      sectionId: "sec_02",
      sourceId: "src_02",
      claim: "Veto player theory mechanism",
      evidenceText:
        "The more veto players there are, and the greater the ideological distance between them, the more policy stability we should expect.",
      explanation: "Explaining the mechanism behind policy stability in consensus systems",
      citation: "Tsebelis (2002, p. 19)",
      tags: "mechanism,policy stability",
    },
    {
      id: "ev_03",
      essayId: "essay_01",
      sectionId: "sec_03",
      sourceId: "src_01",
      claim: "Consensus democracy quality advantage",
      evidenceText:
        "On the dimension of democratic quality, consensus democracy has a clear edge over majoritarian democracy.",
      explanation: "Supporting the claim that consensus systems produce better outcomes",
      citation: "Lijphart (1999, p. 275)",
      tags: "democratic quality,evidence",
    },
    {
      id: "ev_04",
      essayId: "essay_01",
      sectionId: "sec_04",
      sourceId: "src_04",
      claim: "Westminster model trade-offs",
      evidenceText:
        "The Westminster model's single-party majority government enables rapid policy change, but at the cost of exclusion and potential policy reversal.",
      explanation: "Presenting the majoritarian advantage in decisiveness and its trade-offs",
      citation: "Mitchell (2026, Slide 14)",
      tags: "Westminster,decisiveness",
    },
    {
      id: "ev_05",
      essayId: "essay_01",
      sectionId: "sec_05",
      sourceId: "src_03",
      claim: "Consensus democracy decline",
      evidenceText:
        "Consensus democracy in Western Europe has been in decline since the early 2000s, challenged by populist movements, party system fragmentation, and declining trust.",
      explanation: "Critiquing the durability of the consensus model in contemporary conditions",
      citation: "Qvortrup (2022, p. 318)",
      tags: "decline,critique,populism",
    },
  ];

  for (const ev of evidenceItems) {
    await prisma.evidenceItem.upsert({
      where: { id: ev.id },
      update: {},
      create: ev,
    });
  }
  console.log(`Created ${evidenceItems.length} evidence items`);

  const conversation = await prisma.conversation.upsert({
    where: { id: "conv_01" },
    update: {},
    create: {
      id: "conv_01",
      userId: user.id,
      moduleId: "mod_02",
      title: "Lijphart vs Tsebelis: Key differences",
      mode: "source_grounded",
    },
  });

  const messages = [
    {
      id: "msg_01",
      conversationId: "conv_01",
      role: "user",
      content:
        "What is the difference between Lijphart's consensus model and Tsebelis's veto player theory?",
    },
    {
      id: "msg_02",
      conversationId: "conv_01",
      role: "assistant",
      content:
        "Lijphart classifies democracies along a majoritarian-consensus dimension using ten institutional variables grouped into two dimensions: the executives-parties dimension and the federal-unitary dimension. Tsebelis takes a more mechanistic approach, identifying veto players whose agreement is necessary to change policy. The key difference is the level of analysis: Lijphart classifies entire democratic systems, while Tsebelis provides a micro-level mechanism for understanding policy outcomes within any system.",
      citedChunkIds: "src_01,src_02",
    },
  ];

  for (const msg of messages) {
    await prisma.conversationMessage.create({ data: msg });
  }
  console.log(`Created conversation with ${messages.length} messages`);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
