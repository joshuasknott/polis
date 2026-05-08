import type {
  AIProviderConnection,
  Assignment,
  Argument,
  CoThinker,
  Counterargument,
  CitedChunk,
  Draft,
  EvidenceItem,
  Folder,
  Judgement,
  MessageLabel,
  Module,
  ResearchGap,
  Review,
  RubricCriterion,
  SourceFile,
  User,
  WorkbenchTool,
} from "../types";

export const mockUser: User = {
  id: "u_01",
  name: "Alex Chen",
  email: "alex.chen@university.ac.uk",
  university: "University of Edinburgh",
  course: "Politics and International Relations",
  yearOfStudy: 3,
  createdAt: "2025-09-15T10:00:00Z",
};

export const mockModules: Module[] = [
  {
    id: "mod_01",
    workspaceId: "ws_01",
    title: "International Security",
    code: "PIRR30041",
    academicYear: "2025-26",
    semester: "Semester 1",
    description:
      "Examines great power competition, deterrence, cyber threats, and human security through source-grounded coursework production.",
    sourceCount: 5,
    noteCount: 12,
    assignmentCount: 1,
    essayProjectCount: 1,
    lastActivityAt: "2026-04-28T14:30:00Z",
    color: "#1e3a5f",
  },
  {
    id: "mod_02",
    workspaceId: "ws_01",
    title: "Comparative Government and Politics",
    code: "PIRR30022",
    academicYear: "2025-26",
    semester: "Semester 1",
    description:
      "Compares democratic institutions, electoral systems, executive-legislative relations, federalism, and governance outcomes.",
    sourceCount: 7,
    noteCount: 18,
    assignmentCount: 1,
    essayProjectCount: 1,
    lastActivityAt: "2026-04-29T09:15:00Z",
    color: "#4a6741",
  },
  {
    id: "mod_03",
    workspaceId: "ws_01",
    title: "Elections and Voters",
    code: "PIRR30055",
    academicYear: "2025-26",
    semester: "Semester 2",
    description:
      "Analyses electoral systems, voting behaviour, party competition, media effects, and identity in democratic choice.",
    sourceCount: 2,
    noteCount: 7,
    assignmentCount: 1,
    essayProjectCount: 1,
    lastActivityAt: "2026-04-27T16:45:00Z",
    color: "#7c3aed",
  },
  {
    id: "mod_04",
    workspaceId: "ws_01",
    title: "Research Methods",
    code: "SSPS30010",
    academicYear: "2025-26",
    semester: "Semester 2",
    description:
      "Introduces qualitative and quantitative research methods, case selection, causal inference, and ethical research practice.",
    sourceCount: 2,
    noteCount: 6,
    assignmentCount: 0,
    essayProjectCount: 0,
    lastActivityAt: "2026-04-26T11:20:00Z",
    color: "#b45309",
  },
];

export const defaultFolderStructure: Omit<Folder, "id" | "moduleId" | "sourceCount">[] = [
  { parentFolderId: null, name: "Module Info", type: "module_info", sortOrder: 0 },
  { parentFolderId: null, name: "Readings", type: "readings", sortOrder: 1 },
  { parentFolderId: null, name: "Lecture and Seminar Material", type: "lectures", sortOrder: 2 },
  { parentFolderId: null, name: "Source Notes", type: "source_notes", sortOrder: 3 },
  { parentFolderId: null, name: "Assignments", type: "assignments", sortOrder: 4 },
  { parentFolderId: null, name: "Argument Maps", type: "argument_maps", sortOrder: 5 },
  { parentFolderId: null, name: "Drafts and Reviews", type: "drafts", sortOrder: 6 },
  { parentFolderId: null, name: "Submissions", type: "submissions", sortOrder: 7 },
];

export const mockFolders: Folder[] = mockModules.flatMap((mod, moduleIndex) => {
  const base = moduleIndex * defaultFolderStructure.length;
  return defaultFolderStructure.map((folder, folderIndex) => ({
    ...folder,
    id: `f_${String(base + folderIndex + 1).padStart(2, "0")}`,
    moduleId: mod.id,
    sourceCount: 0,
  }));
});

export const mockSources: SourceFile[] = [
  {
    id: "src_01",
    moduleId: "mod_02",
    folderId: "f_10",
    title: "Patterns of Democracy: Government Forms and Performance in Thirty-Six Countries",
    author: "Arend Lijphart",
    year: 1999,
    type: "book_chapter",
    status: "processed",
    tags: ["democracy", "consensus", "majoritarian", "comparative politics"],
    citation: "Lijphart, A. (1999) Patterns of Democracy. New Haven: Yale University Press. Ch. 1-3.",
    pageCount: 48,
    uploadedAt: "2026-01-18T10:00:00Z",
    summary:
      "Lijphart compares consensus and majoritarian democracies and argues that consensus systems perform better across several democratic quality indicators.",
    mainArgument:
      "Power-sharing, proportional representation, and multiparty government can produce more inclusive and durable democratic outcomes than concentrated majority rule.",
    keyConcepts: ["consensus democracy", "majoritarian democracy", "power-sharing", "proportional representation"],
  },
  {
    id: "src_02",
    moduleId: "mod_02",
    folderId: "f_10",
    title: "Veto Players: How Political Institutions Work",
    author: "George Tsebelis",
    year: 2002,
    type: "book_chapter",
    status: "processed",
    tags: ["veto players", "institutional analysis", "policy stability"],
    citation: "Tsebelis, G. (2002) Veto Players. Princeton: Princeton University Press. Ch. 1-2.",
    pageCount: 62,
    uploadedAt: "2026-01-20T14:00:00Z",
    summary:
      "Tsebelis explains policy stability through the number and ideological distance of actors whose agreement is needed for change.",
    mainArgument:
      "More veto players and greater ideological distance narrow the range of feasible policy change and increase policy stability.",
    keyConcepts: ["veto players", "policy stability", "winset", "institutional veto players"],
  },
  {
    id: "src_03",
    moduleId: "mod_02",
    folderId: "f_10",
    title: "The Rise and Fall of Consensus Democracy in Western Europe, 1945-2019",
    author: "Matt Qvortrup",
    year: 2022,
    type: "journal_article",
    status: "processed",
    tags: ["consensus democracy", "Western Europe", "populism"],
    citation:
      "Qvortrup, M. (2022) 'The Rise and Fall of Consensus Democracy in Western Europe', European Political Science Review, 14(3), pp. 312-329.",
    pageCount: 18,
    uploadedAt: "2026-02-05T09:30:00Z",
    summary:
      "Qvortrup argues that populism and polarisation have weakened consensus practices in Western Europe since the early 2000s.",
    mainArgument:
      "Consensus democracy remains analytically useful but its practical operation is increasingly challenged by party fragmentation and declining institutional trust.",
    keyConcepts: ["democratic decline", "populism", "party fragmentation", "institutional trust"],
  },
  {
    id: "src_04",
    moduleId: "mod_02",
    folderId: "f_11",
    title: "Week 4 Lecture: Comparing Westminster and Consensus Models",
    author: "Dr. Sarah Mitchell",
    year: 2026,
    type: "lecture_slides",
    status: "processed",
    tags: ["Westminster model", "consensus model", "UK politics"],
    citation: "Mitchell, S. (2026) 'Comparing Westminster and Consensus Models', PIRR30022 Lecture 4.",
    pageCount: 32,
    uploadedAt: "2026-02-10T08:00:00Z",
    summary:
      "Lecture material comparing Westminster majoritarianism with consensus democracy using the UK and Netherlands as examples.",
    mainArgument:
      "The UK is an archetypal majoritarian case, but devolution and bicameral constraints complicate pure typologies.",
    keyConcepts: ["Westminster model", "devolution", "first-past-the-post", "coalition government"],
  },
  {
    id: "src_05",
    moduleId: "mod_02",
    folderId: "f_13",
    title: "Assignment Brief: Majoritarianism vs Consensus Democracy",
    author: "Course Convenor",
    year: 2026,
    type: "assignment_brief",
    status: "processed",
    tags: ["assessment", "assignment brief", "comparative politics"],
    citation: "PIRR30022 (2026) Assignment Brief 2: Majoritarianism vs Consensus Democracy.",
    pageCount: 3,
    uploadedAt: "2026-02-12T12:00:00Z",
    summary:
      "Assessment brief asking students to compare majoritarian and consensus democracies against effective government and policy-making.",
    mainArgument: "N/A - assignment document",
    keyConcepts: ["assignment question", "assessment criteria", "majoritarianism", "consensus democracy"],
  },
  {
    id: "src_06",
    moduleId: "mod_02",
    folderId: "f_09",
    title: "PIRR30022 Marking Rubric",
    author: "Course Convenor",
    year: 2026,
    type: "marking_rubric",
    status: "processed",
    tags: ["rubric", "marking criteria", "assessment"],
    citation: "PIRR30022 (2026) Marking Rubric.",
    pageCount: 2,
    uploadedAt: "2026-02-12T12:00:00Z",
    summary:
      "Marking criteria covering argument clarity, theoretical understanding, evidence use, structure, critical analysis, and referencing.",
    mainArgument: "N/A - rubric document",
    keyConcepts: ["marking criteria", "argument clarity", "evidence use", "critical analysis"],
  },
  {
    id: "src_07",
    moduleId: "mod_01",
    folderId: "f_02",
    title: "The Return of Great Power Politics",
    author: "Christopher Layne",
    year: 2018,
    type: "journal_article",
    status: "processed",
    tags: ["great power politics", "realism", "international security"],
    citation: "Layne, C. (2018) 'The Return of Great Power Politics', Survival, 60(2), pp. 53-68.",
    pageCount: 16,
    uploadedAt: "2026-01-15T10:00:00Z",
    summary:
      "Layne argues that renewed great power rivalry follows structural shifts in the international system rather than individual leadership choices.",
    mainArgument:
      "Relative US decline and China's rise are reviving multipolar competition and reshaping international security.",
    keyConcepts: ["great power competition", "structural realism", "US hegemony", "multipolarity"],
  },
  {
    id: "src_08",
    moduleId: "mod_01",
    folderId: "f_02",
    title: "Nuclear Deterrence in a New Era: Challenges and Adaptations",
    author: "Keir Lieber & Daryl Press",
    year: 2020,
    type: "journal_article",
    status: "processed",
    tags: ["nuclear deterrence", "strategic stability", "arms control"],
    citation: "Lieber, K. and Press, D. (2020) 'Nuclear Deterrence in a New Era', International Security, 45(1), pp. 7-48.",
    pageCount: 42,
    uploadedAt: "2026-01-22T11:00:00Z",
    summary:
      "The article examines how precision weapons, cyber capabilities, and missile defence challenge established deterrence assumptions.",
    mainArgument:
      "Emerging technologies complicate mutual assured destruction and require updated deterrence thinking.",
    keyConcepts: ["nuclear deterrence", "MAD", "precision strike", "cyber-nuclear nexus"],
  },
  {
    id: "src_09",
    moduleId: "mod_03",
    folderId: "f_18",
    title: "The American Voter Revisited",
    author: "Lewis-Beck et al.",
    year: 2008,
    type: "book",
    status: "processed",
    tags: ["voting behaviour", "party identification", "electoral studies"],
    citation: "Lewis-Beck, M. et al. (2008) The American Voter Revisited. Ann Arbor: University of Michigan Press.",
    pageCount: 45,
    uploadedAt: "2026-01-25T13:00:00Z",
    summary:
      "The book revisits the Michigan model and updates party identification theory with contemporary electoral evidence.",
    mainArgument:
      "Party identification remains powerful, but issue salience and media environments make voting behaviour more variable.",
    keyConcepts: ["party identification", "Michigan model", "issue voting", "media effects"],
  },
  {
    id: "src_10",
    moduleId: "mod_04",
    folderId: "f_26",
    title: "Case Study Research: Principles and Practices",
    author: "John Gerring",
    year: 2017,
    type: "book_chapter",
    status: "processed",
    tags: ["case study", "research methods", "methodology"],
    citation: "Gerring, J. (2017) Case Study Research: Principles and Practices. 2nd edn. Cambridge: Cambridge University Press. Ch. 1.",
    pageCount: 30,
    uploadedAt: "2026-02-01T10:00:00Z",
    summary:
      "Gerring explains what constitutes a case study, when it is appropriate, and how to protect methodological rigour.",
    mainArgument:
      "Case study research can support robust causal analysis when case selection and within-case inference are explicit.",
    keyConcepts: ["case selection", "within-case analysis", "causal inference", "methodological rigour"],
  },
];

const mockRubric: RubricCriterion[] = [
  { name: "Argument clarity", description: "Clear, focused, and consistently argued position", weight: 25 },
  { name: "Theoretical understanding", description: "Accurate use of relevant theories and concepts", weight: 20 },
  { name: "Use of evidence", description: "Appropriate academic sources used to support claims", weight: 20 },
  { name: "Structure", description: "Coherent organisation and signposting", weight: 15 },
  { name: "Critical analysis", description: "Independent evaluation of claims and counterclaims", weight: 15 },
  { name: "Referencing", description: "Accurate citations and bibliography", weight: 5 },
];

export const mockAssignments: Assignment[] = [
  {
    id: "asn_01",
    moduleId: "mod_02",
    title: "Majoritarianism vs Consensus Democracy",
    question:
      "Compare majoritarian with consensus democracies: which system better delivers effective government and effective policy-making?",
    wordLimit: 3000,
    dueDate: "2026-05-15T23:59:00Z",
    rubric: mockRubric,
    selectedSourceIds: ["src_01", "src_02", "src_03", "src_04", "src_05", "src_06"],
    stage: "draft",
    createdAt: "2026-02-12T13:00:00Z",
  },
  {
    id: "asn_02",
    moduleId: "mod_01",
    title: "Great Power Competition and Security Order",
    question: "Has the return of great power politics fundamentally changed the international security environment?",
    wordLimit: 2500,
    dueDate: "2026-05-22T23:59:00Z",
    rubric: mockRubric,
    selectedSourceIds: ["src_07", "src_08"],
    stage: "map",
    createdAt: "2026-03-01T10:00:00Z",
  },
];

export const mockArguments: Argument[] = [
  {
    id: "arg_01",
    assignmentId: "asn_01",
    claim:
      "Consensus democracies often produce more durable policy because decisions require bargaining across a wider set of actors.",
    synthesis:
      "Lijphart's normative case for consensus democracy is strengthened by Tsebelis's mechanism of veto-player induced stability.",
    counterarguments: ["Consensus systems may respond slowly in crises", "Accountability can be less clear when responsibility is shared"],
    sortOrder: 1,
    evidenceLinks: [
      {
        id: "ev_01",
        argumentId: "arg_01",
        sourceId: "src_01",
        sourceTitle: "Patterns of Democracy",
        quote:
          "Consensus democracy is characterised by power-sharing, bargaining, and compromise rather than the concentration and exercise of power by a simple majority.",
        pageRange: "pp. 2-3",
        usage: "Defines the institutional features that make policy bargaining central to consensus systems.",
        strength: "strong",
      },
      {
        id: "ev_02",
        argumentId: "arg_01",
        sourceId: "src_02",
        sourceTitle: "Veto Players",
        quote:
          "The more veto players there are, and the greater the ideological distance between them, the more policy stability we should expect.",
        pageRange: "p. 19",
        usage: "Explains the mechanism behind policy stability in systems with multiple institutional actors.",
        strength: "strong",
      },
    ],
  },
  {
    id: "arg_02",
    assignmentId: "asn_01",
    claim:
      "Majoritarian democracy offers decisiveness, but that advantage can become policy volatility when governments alternate.",
    synthesis:
      "The Westminster case helps frame decisiveness as a real benefit while preserving the argument that durability matters for effectiveness.",
    counterarguments: ["Clearer accountability can improve democratic responsiveness"],
    sortOrder: 2,
    evidenceLinks: [
      {
        id: "ev_03",
        argumentId: "arg_02",
        sourceId: "src_04",
        sourceTitle: "Week 4 Lecture: Comparing Westminster and Consensus Models",
        quote:
          "The Westminster model's single-party majority government enables rapid policy change, but at the cost of exclusion and potential policy reversal.",
        pageRange: "Slide 14",
        usage: "Shows the trade-off between decisiveness and policy reversal in majoritarian systems.",
        strength: "moderate",
      },
    ],
  },
  {
    id: "arg_03",
    assignmentId: "asn_01",
    claim:
      "The consensus model needs qualification because contemporary polarisation can weaken the bargaining practices it depends on.",
    synthesis:
      "Qvortrup provides the main refinement: consensus institutions are not self-sustaining under conditions of populist polarisation.",
    counterarguments: ["Institutional rules may still constrain polarised actors"],
    sortOrder: 3,
    evidenceLinks: [
      {
        id: "ev_04",
        argumentId: "arg_03",
        sourceId: "src_03",
        sourceTitle: "The Rise and Fall of Consensus Democracy in Western Europe",
        quote:
          "Consensus democracy in Western Europe has been in decline since the early 2000s, challenged by populist movements, party system fragmentation, and declining trust.",
        pageRange: "p. 318",
        usage: "Adds a limitation to a simple pro-consensus answer.",
        strength: "moderate",
      },
    ],
  },
];

export const mockDrafts: Draft[] = [
  {
    id: "draft_01",
    assignmentId: "asn_01",
    version: 1,
    wordCount: 378,
    createdAt: "2026-04-10T15:00:00Z",
    updatedAt: "2026-04-18T11:30:00Z",
    content: `Majoritarian and consensus democracies represent two different approaches to democratic governance. This draft argues that while majoritarian systems offer greater decisiveness and clearer accountability, consensus democracies usually produce more durable, legitimate, and broadly effective policy outcomes.

Lijphart's typology provides the starting point. Consensus democracy is built around power-sharing, proportional representation, and multiparty bargaining, while majoritarian democracy concentrates governing authority in the hands of a parliamentary majority. Tsebelis's veto player theory helps explain why this matters for policy-making: where more actors must agree, policy change becomes slower but also more stable.

The argument should not treat consensus democracy as automatically superior. Contemporary polarisation and populist party fragmentation may weaken the trust and bargaining norms that consensus arrangements require. The final version needs stronger empirical examples and a clearer definition of effective government before the conclusion can be secure.`,
  },
];

export const mockJudgements: Judgement[] = [
  {
    id: "jud_01",
    assignmentId: "asn_01",
    type: "evidence_sufficiency",
    severity: "warning",
    findings: [
      "The argument has strong theoretical support from Lijphart and Tsebelis.",
      "The majoritarian side relies too heavily on lecture material and needs one peer-reviewed source.",
      "The draft needs concrete policy examples before its effectiveness judgement is convincing.",
    ],
    createdAt: "2026-04-18T12:00:00Z",
  },
];

export const mockReviews: Review[] = [
  {
    id: "rev_01",
    draftId: "draft_01",
    strengths: [
      "Clear comparative claim that does not simply describe both models",
      "Good pairing of Lijphart's typology with Tsebelis's causal mechanism",
      "Acknowledges the limits of consensus democracy rather than overstating the case",
    ],
    weaknesses: [
      "The majoritarian argument is underdeveloped",
      "Effective government is not defined precisely enough",
      "The draft needs more empirical examples tied to specific policy outcomes",
    ],
    missingEvidence: [
      "A source defending majoritarian responsiveness or accountability",
      "A recent empirical case on UK or Dutch policy performance",
    ],
    unsupportedClaims: ["Consensus democracies usually produce more legitimate outcomes"],
    revisionPriorities: [
      "Define effective government in the introduction",
      "Add one peer-reviewed source on majoritarian accountability",
      "Turn each argument-map claim into a section topic sentence",
    ],
    rubricAlignment:
      "Strong direction on argument clarity and theory; evidence use and empirical detail remain the main risks.",
    overallFeedback:
      "This is a viable student-owned draft direction. Polis should keep helping with source checks, structure, and review rather than producing final prose for submission.",
  },
];

const mockCitedChunks: CitedChunk[] = [
  {
    chunkId: "chk_01",
    sourceId: "src_01",
    sourceTitle: "Patterns of Democracy",
    quote:
      "Consensus democracy is characterised by power-sharing, bargaining, and compromise rather than the concentration and exercise of power by a simple majority.",
    pageRange: "pp. 2-3",
  },
  {
    chunkId: "chk_02",
    sourceId: "src_02",
    sourceTitle: "Veto Players",
    quote:
      "The more veto players there are, and the greater the ideological distance between them, the more policy stability we should expect.",
    pageRange: "p. 19",
  },
];

const mockLabels: MessageLabel[] = [{ type: "source_supported", text: "Supported by uploaded sources" }];

export const mockCoThinkers: CoThinker[] = [
  {
    id: "conv_01",
    moduleId: "mod_02",
    assignmentId: "asn_01",
    title: "Lijphart and Tsebelis for the argument map",
    scope: "assignment",
    stage: "map",
    createdAt: "2026-04-28T14:00:00Z",
    messages: [
      {
        id: "msg_01",
        role: "user",
        content: "How should I connect Lijphart's consensus model to Tsebelis's veto player theory?",
        citedChunks: [],
        warnings: [],
        labels: [],
        followUpSuggestions: [],
        createdAt: "2026-04-28T14:00:00Z",
      },
      {
        id: "msg_02",
        role: "assistant",
        content:
          "Use Lijphart to define and evaluate the democratic models, then use Tsebelis to explain one mechanism behind policy stability. This supports an argument about durability, but it does not by itself prove overall policy effectiveness.",
        citedChunks: mockCitedChunks,
        warnings: ["The current source base needs a stronger source defending majoritarian accountability."],
        labels: mockLabels,
        followUpSuggestions: [
          "Map this into three argument claims",
          "Identify evidence gaps before drafting",
          "Check whether my claim overstates Lijphart",
        ],
        createdAt: "2026-04-28T14:01:00Z",
      },
    ],
  },
];

export const mockConversations = mockCoThinkers.map((conversation) => ({
  ...conversation,
  mode: conversation.stage,
}));

export const mockTools: WorkbenchTool[] = [
  {
    id: "reading_summary",
    title: "Reading Summary",
    description: "Summarise a source by argument, method, concepts, evidence, and limitations.",
    inputType: "One or more selected sources",
    outputType: "Structured source summary",
    icon: "BookOpen",
    stages: ["understand"],
    academicIntegrityNote: "Use summaries to orient your reading; verify claims against the original source.",
  },
  {
    id: "concept_extractor",
    title: "Concept Extractor",
    description: "Extract key theories, concepts, and definitions from selected sources.",
    inputType: "One or more selected sources",
    outputType: "Concept cards with source references",
    icon: "Lightbulb",
    stages: ["understand"],
    academicIntegrityNote: "Definitions are study aids and should be checked against the source text.",
  },
  {
    id: "literature_matrix",
    title: "Literature Matrix",
    description: "Compare sources by claim, evidence, method, and relevance to the assignment question.",
    inputType: "Multiple sources",
    outputType: "Source comparison matrix",
    icon: "Table",
    stages: ["understand", "map"],
    academicIntegrityNote: "The matrix organises sources; your synthesis remains your own work.",
  },
  {
    id: "argument_map",
    title: "Argument Map",
    description: "Map claims, evidence links, counterarguments, and unresolved gaps.",
    inputType: "Assignment question and selected sources",
    outputType: "Argument structure",
    icon: "Network",
    stages: ["map"],
    academicIntegrityNote: "Argument mapping supports planning without writing a submit-ready answer.",
  },
  {
    id: "evidence_bank",
    title: "Evidence Bank",
    description: "Collect source passages and attach them to specific argument claims.",
    inputType: "Selected sources or folder",
    outputType: "Evidence links",
    icon: "Database",
    stages: ["map", "build"],
    academicIntegrityNote: "All quoted or paraphrased material must be checked and cited by you.",
  },
  {
    id: "argument_builder",
    title: "Argument Builder",
    description: "Turn an assignment question and evidence base into student-owned argument claims.",
    inputType: "Assignment, rubric, and evidence links",
    outputType: "Claim set with evidence gaps",
    icon: "FileText",
    stages: ["build"],
    academicIntegrityNote: "Use this to test and refine your own line of argument, not to outsource writing.",
  },
  {
    id: "counterargument_finder",
    title: "Counterargument Finder",
    description: "Identify plausible objections and locate source-grounded ways to address them.",
    inputType: "Argument claims and sources",
    outputType: "Counterarguments and evidence needs",
    icon: "Swords",
    stages: ["judge", "build"],
    academicIntegrityNote: "Counterarguments strengthen your reasoning; final evaluation must be yours.",
  },
  {
    id: "draft_review",
    title: "Draft Review",
    description: "Review a draft against the rubric, evidence base, and assignment question.",
    inputType: "Draft text and marking rubric",
    outputType: "Revision priorities",
    icon: "MessageSquareText",
    stages: ["refine"],
    academicIntegrityNote: "Feedback should guide revision; Polis should not rewrite your draft for submission.",
  },
  {
    id: "citation_safety_check",
    title: "Citation Safety Check",
    description: "Flag unsupported claims, risky paraphrases, and missing source links.",
    inputType: "Draft text",
    outputType: "Citation and evidence audit",
    icon: "ShieldCheck",
    stages: ["draft", "refine"],
    academicIntegrityNote: "This reduces citation risk but does not replace your own verification.",
  },
  {
    id: "research_gap_finder",
    title: "Evidence Gap Finder",
    description: "Judge whether the current source base can support the argument you want to make.",
    inputType: "Assignment, arguments, and selected sources",
    outputType: "Judgement with missing evidence",
    icon: "Search",
    stages: ["judge"],
    academicIntegrityNote: "Gap analysis helps you decide what to read next; it cannot invent missing evidence.",
  },
];

export const mockProviders: AIProviderConnection[] = [
  {
    id: "prov_01",
    provider: "OpenAI",
    status: "disconnected",
    modelPreference: "gpt-4o",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "prov_02",
    provider: "Anthropic",
    status: "disconnected",
    modelPreference: "claude-sonnet-4-20250514",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "prov_03",
    provider: "Google Gemini",
    status: "disconnected",
    modelPreference: "gemini-2.5-pro",
    createdAt: "2026-01-15T10:00:00Z",
  },
];

const mockEssaySections = mockArguments.map((argument, index) => ({
  id: `sec_${String(index + 1).padStart(2, "0")}`,
  heading: argument.claim,
  points: [argument.synthesis, ...argument.counterarguments.map((counter) => `Counterargument: ${counter}`)],
  evidenceIds: argument.evidenceLinks.map((link) => link.id),
  wordAllocation: index === 0 ? 900 : 700,
}));

const mockEvidence: EvidenceItem[] = mockArguments.flatMap((argument) =>
  argument.evidenceLinks.map((link) => ({
    id: link.id,
    sourceId: link.sourceId,
    sourceTitle: link.sourceTitle,
    quote: link.quote,
    pageRange: link.pageRange,
    argumentUse: link.usage,
  }))
);

const mockCounterarguments: Counterargument[] = mockArguments.flatMap((argument, argumentIndex) =>
  argument.counterarguments.map((claim, counterIndex) => ({
    id: `ca_${argumentIndex + 1}_${counterIndex + 1}`,
    claim,
    sourceId: argument.evidenceLinks[0]?.sourceId || "src_01",
    sourceTitle: argument.evidenceLinks[0]?.sourceTitle || "Patterns of Democracy",
    rebuttal: "Needs student-authored evaluation using the mapped evidence.",
  }))
);

const mockGaps: ResearchGap[] = mockJudgements[0].findings.map((finding, index) => ({
  id: `gap_${String(index + 1).padStart(2, "0")}`,
  description: finding,
  severity: index === 1 ? "high" : "medium",
  suggestedSourceType: "Peer-reviewed source or specific empirical case",
}));

export const mockEssayProject = {
  id: "asn_01",
  moduleId: mockAssignments[0].moduleId,
  title: mockAssignments[0].title,
  question: mockAssignments[0].question,
  wordCount: mockAssignments[0].wordLimit,
  dueDate: mockAssignments[0].dueDate,
  rubric: mockAssignments[0].rubric,
  selectedSourceIds: mockAssignments[0].selectedSourceIds,
  thesis:
    "While majoritarian democracies offer greater decisiveness, consensus democracies produce more durable and legitimate policy outcomes when supported by stable bargaining norms.",
  status: mockAssignments[0].stage,
  structure: mockEssaySections,
  evidenceBank: mockEvidence,
  counterarguments: mockCounterarguments,
  gaps: mockGaps,
  draftContent: mockDrafts[0].content,
};

export const mockDraftReview = mockReviews[0];

export function getSourceById(id: string): SourceFile | undefined {
  return mockSources.find((source) => source.id === id);
}

export function getModuleById(id: string): Module | undefined {
  return mockModules.find((mod) => mod.id === id);
}

export function getSourcesForModule(moduleId: string): SourceFile[] {
  return mockSources.filter((source) => source.moduleId === moduleId);
}

export function getFoldersForModule(moduleId: string): Folder[] {
  return mockFolders.filter((folder) => folder.moduleId === moduleId);
}

export function getSourcesForFolder(folderId: string): SourceFile[] {
  return mockSources.filter((source) => source.folderId === folderId);
}

export function getAssignmentsForModule(moduleId: string): Assignment[] {
  return mockAssignments.filter((assignment) => assignment.moduleId === moduleId);
}

export function getArgumentsForAssignment(assignmentId: string): Argument[] {
  return mockArguments.filter((argument) => argument.assignmentId === assignmentId);
}

export function getDraftsForAssignment(assignmentId: string): Draft[] {
  return mockDrafts.filter((draft) => draft.assignmentId === assignmentId);
}

export function getLatestDraftForAssignment(assignmentId: string): Draft | undefined {
  return getDraftsForAssignment(assignmentId).sort((a, b) => b.version - a.version)[0];
}
