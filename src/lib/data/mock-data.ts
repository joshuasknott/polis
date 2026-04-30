import {
  User,
  Module,
  Folder,
  SourceFile,
  AIConversation,
  EssayProject,
  AcademicTool,
  DraftReview,
  AIProviderConnection,
  CitedChunk,
  MessageLabel,
  RubricCriterion,
  EssaySection,
  EvidenceItem,
  Counterargument,
  ResearchGap,
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
      "Examines the changing nature of international security, including great power competition, nuclear deterrence, cyber threats, and human security.",
    sourceCount: 18,
    noteCount: 34,
    essayProjectCount: 2,
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
      "Compares democratic systems across countries, examining electoral systems, executive-legislative relations, federalism, and governance outcomes.",
    sourceCount: 24,
    noteCount: 41,
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
      "Analyses electoral systems, voting behaviour, party competition, and the role of media and identity in shaping democratic choice.",
    sourceCount: 15,
    noteCount: 22,
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
      "Introduces qualitative and quantitative research methods for social science, including case study design, survey analysis, and ethical research practice.",
    sourceCount: 12,
    noteCount: 19,
    essayProjectCount: 1,
    lastActivityAt: "2026-04-26T11:20:00Z",
    color: "#b45309",
  },
];

export const defaultFolderStructure: Omit<Folder, "id" | "moduleId" | "sourceCount">[] = [
  { parentFolderId: null, name: "Module Info", type: "module_info", sortOrder: 0 },
  { parentFolderId: null, name: "Readings", type: "readings", sortOrder: 1 },
  { parentFolderId: null, name: "Lecture and Seminar Material", type: "lectures", sortOrder: 2 },
  { parentFolderId: null, name: "Source Notes", type: "source_notes", sortOrder: 3 },
  { parentFolderId: null, name: "Essay Plans", type: "essay_plans", sortOrder: 4 },
  { parentFolderId: null, name: "Drafts and Feedback", type: "drafts", sortOrder: 5 },
  { parentFolderId: null, name: "Final Submission", type: "final_submission", sortOrder: 6 },
];

export const mockFolders: Folder[] = [
  { id: "f_01", moduleId: "mod_01", parentFolderId: null, name: "Module Info", type: "module_info", sortOrder: 0, sourceCount: 2 },
  { id: "f_02", moduleId: "mod_01", parentFolderId: null, name: "Readings", type: "readings", sortOrder: 1, sourceCount: 8 },
  { id: "f_03", moduleId: "mod_01", parentFolderId: null, name: "Lecture and Seminar Material", type: "lectures", sortOrder: 2, sourceCount: 4 },
  { id: "f_04", moduleId: "mod_01", parentFolderId: null, name: "Source Notes", type: "source_notes", sortOrder: 3, sourceCount: 0 },
  { id: "f_05", moduleId: "mod_01", parentFolderId: null, name: "Essay Plans", type: "essay_plans", sortOrder: 4, sourceCount: 1 },
  { id: "f_06", moduleId: "mod_01", parentFolderId: null, name: "Drafts and Feedback", type: "drafts", sortOrder: 5, sourceCount: 3 },
  { id: "f_07", moduleId: "mod_01", parentFolderId: null, name: "Final Submission", type: "final_submission", sortOrder: 6, sourceCount: 0 },
  { id: "f_08", moduleId: "mod_02", parentFolderId: null, name: "Module Info", type: "module_info", sortOrder: 0, sourceCount: 2 },
  { id: "f_09", moduleId: "mod_02", parentFolderId: null, name: "Readings", type: "readings", sortOrder: 1, sourceCount: 12 },
  { id: "f_10", moduleId: "mod_02", parentFolderId: null, name: "Lecture and Seminar Material", type: "lectures", sortOrder: 2, sourceCount: 5 },
  { id: "f_11", moduleId: "mod_02", parentFolderId: null, name: "Source Notes", type: "source_notes", sortOrder: 3, sourceCount: 0 },
  { id: "f_12", moduleId: "mod_02", parentFolderId: null, name: "Essay Plans", type: "essay_plans", sortOrder: 4, sourceCount: 2 },
  { id: "f_13", moduleId: "mod_02", parentFolderId: null, name: "Drafts and Feedback", type: "drafts", sortOrder: 5, sourceCount: 3 },
  { id: "f_14", moduleId: "mod_02", parentFolderId: null, name: "Final Submission", type: "final_submission", sortOrder: 6, sourceCount: 0 },
];

export const mockSources: SourceFile[] = [
  {
    id: "src_01",
    moduleId: "mod_02",
    folderId: "f_09",
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
      "Lijphart presents a comprehensive comparison of consensus and majoritarian democracy models across 36 countries, arguing that consensus democracies outperform majoritarian ones on measures of democratic quality, power sharing, and policy moderation.",
    mainArgument:
      "Consensus democracy, characterised by power-sharing, proportional representation, and multi-party systems, produces better democratic outcomes than majoritarian systems across multiple quality-of-democracy indicators.",
    keyConcepts: ["consensus democracy", "majoritarian democracy", "power-sharing", "proportional representation", "executive-legislative balance", "federalism vs unitarism"],
  },
  {
    id: "src_02",
    moduleId: "mod_02",
    folderId: "f_09",
    title: "Veto Players: How Political Institutions Work",
    author: "George Tsebelis",
    year: 2002,
    type: "book_chapter",
    status: "processed",
    tags: ["veto players", "institutional analysis", "policy stability", "comparative politics"],
    citation: "Tsebelis, G. (2002) Veto Players: How Political Institutions Work. Princeton: Princeton University Press. Ch. 1-2.",
    pageCount: 62,
    uploadedAt: "2026-01-20T14:00:00Z",
    summary:
      "Tsebelis develops a veto player theory of political institutions, arguing that the number and ideological distance between veto players determines policy stability and the range of feasible policy change.",
    mainArgument:
      "More veto players with greater ideological distance between them leads to greater policy stability and narrower ranges of policy change, regardless of whether the system is formally consensual or majoritarian.",
    keyConcepts: ["veto players", "absorbed veto players", "institutional veto players", "partisan veto players", "policy stability", "winset"],
  },
  {
    id: "src_03",
    moduleId: "mod_02",
    folderId: "f_09",
    title: "The Rise and Fall of Consensus Democracy in Western Europe, 1945-2019",
    author: "Matt Qvortrup",
    year: 2022,
    type: "journal_article",
    status: "processed",
    tags: ["consensus democracy", "Western Europe", "democratic decline", "populism"],
    citation: "Qvortrup, M. (2022) 'The Rise and Fall of Consensus Democracy in Western Europe', European Political Science Review, 14(3), pp. 312-329.",
    pageCount: 18,
    uploadedAt: "2026-02-05T09:30:00Z",
    summary:
      "Qvortrup traces the trajectory of consensus democracy in Western Europe, arguing that while Lijphart's models were accurate for the post-war period, rising populism and polarisation have eroded consensus practices even in traditionally consensual systems.",
    mainArgument:
      "Consensus democracy in Western Europe has been in decline since the early 2000s, challenged by populist movements, party system fragmentation, and declining trust in institutional mediation.",
    keyConcepts: ["consensus democracy decline", "populism", "party fragmentation", "institutional trust", "Lijphart revisited"],
  },
  {
    id: "src_04",
    moduleId: "mod_02",
    folderId: "f_10",
    title: "Week 4 Lecture: Comparing Westminster and Consensus Models",
    author: "Dr. Sarah Mitchell",
    year: 2026,
    type: "lecture_slides",
    status: "processed",
    tags: ["Westminster model", "consensus model", "UK politics", "comparative"],
    citation: "Mitchell, S. (2026) 'Comparing Westminster and Consensus Models', PIRR30022 Lecture 4. University of Edinburgh.",
    pageCount: 32,
    uploadedAt: "2026-02-10T08:00:00Z",
    summary:
      "Lecture comparing the Westminster majoritarian model with Lijphart's consensus model, using the UK and the Netherlands as primary case studies.",
    mainArgument:
      "While the UK Westminster system is the archetypal majoritarian model, its departure from pure majoritarianism in devolved nations illustrates the practical complexity of these categories.",
    keyConcepts: ["Westminster model", "devolution", "first-past-the-post", "coalition government", "bicameralism"],
  },
  {
    id: "src_05",
    moduleId: "mod_02",
    folderId: "f_12",
    title: "Essay Brief: Majoritarianism vs Consensus Democracy",
    author: "Course Convenor",
    year: 2026,
    type: "essay_brief",
    status: "processed",
    tags: ["assessment", "essay brief", "comparative politics"],
    citation: "PIRR30022 (2026) Essay Brief 2: Majoritarianism vs Consensus Democracy. University of Edinburgh.",
    pageCount: 3,
    uploadedAt: "2026-02-12T12:00:00Z",
    summary:
      "Essay assessment asking students to compare majoritarian and consensus democratic systems, evaluating which better delivers effective government and policy-making.",
    mainArgument: "N/A — assessment document",
    keyConcepts: ["essay question", "assessment criteria", "majoritarianism", "consensus democracy"],
  },
  {
    id: "src_06",
    moduleId: "mod_02",
    folderId: "f_08",
    title: "PIRR30022 Marking Rubric",
    author: "Course Convenor",
    year: 2026,
    type: "marking_rubric",
    status: "processed",
    tags: ["rubric", "marking criteria", "assessment"],
    citation: "PIRR30022 (2026) Marking Rubric. University of Edinburgh.",
    pageCount: 2,
    uploadedAt: "2026-02-12T12:00:00Z",
    summary:
      "Marking criteria for PIRR30022 essays covering argument clarity, theoretical understanding, use of evidence, structure, critical analysis, and referencing.",
    mainArgument: "N/A — rubric document",
    keyConcepts: ["marking criteria", "argument clarity", "theoretical understanding", "evidence use", "critical analysis"],
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
    tags: ["great power politics", "realism", "international security", "China", "Russia"],
    citation: "Layne, C. (2018) 'The Return of Great Power Politics', Survival, 60(2), pp. 53-68.",
    pageCount: 16,
    uploadedAt: "2026-01-15T10:00:00Z",
    summary:
      "Layne argues that the return of great power rivalry between the US, China, and Russia represents a fundamental shift in international security, driven by structural realism rather than individual leadership choices.",
    mainArgument:
      "Great power competition is returning due to structural shifts in the international system, particularly the relative decline of US hegemony and the rise of China, not because of specific leaders or decisions.",
    keyConcepts: ["great power competition", "structural realism", "US hegemony", "China rise", "multipolarity", "offensive realism"],
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
    tags: ["nuclear deterrence", "strategic stability", "arms control", "security studies"],
    citation: "Lieber, K. and Press, D. (2020) 'Nuclear Deterrence in a New Era', International Security, 45(1), pp. 7-48.",
    pageCount: 42,
    uploadedAt: "2026-01-22T11:00:00Z",
    summary:
      "Examines how emerging technologies and shifting great power dynamics challenge traditional nuclear deterrence frameworks, arguing that the risk of escalation is growing in ways that Cold War deterrence theory did not anticipate.",
    mainArgument:
      "Advances in precision conventional weapons, cyber capabilities, and missile defence are undermining the stability of mutual assured destruction, requiring new deterrence thinking.",
    keyConcepts: ["nuclear deterrence", "MAD", "conventional precision strike", "cyber-nuclear nexus", "escalation", "strategic stability"],
  },
  {
    id: "src_09",
    moduleId: "mod_01",
    folderId: "f_03",
    title: "Week 6 Lecture: Great Power Competition and Global Order",
    author: "Prof. James Richardson",
    year: 2026,
    type: "lecture_slides",
    status: "processed",
    tags: ["great power", "global order", "lecture notes", "international security"],
    citation: "Richardson, J. (2026) 'Great Power Competition and Global Order', PIRR30041 Lecture 6. University of Edinburgh.",
    pageCount: 28,
    uploadedAt: "2026-02-18T08:00:00Z",
    summary:
      "Lecture examining how the return of great power competition is reshaping global security institutions, alliances, and norms.",
    mainArgument:
      "The post-Cold War liberal international order is being contested by revisionist powers, but complete system change is unlikely; hybrid contestation is the more probable outcome.",
    keyConcepts: ["liberal international order", "revisionist powers", "hybrid contestation", "alliance politics", "institutional adaptation"],
  },
  {
    id: "src_10",
    moduleId: "mod_03",
    folderId: "f_08",
    title: "The American Voter Revisited",
    author: "Lewis-Beck et al.",
    year: 2008,
    type: "book",
    status: "processed",
    tags: ["voting behaviour", "American politics", "party identification", "electoral studies"],
    citation: "Lewis-Beck, M. et al. (2008) The American Voter Revisited. Ann Arbor: University of Michigan Press.",
    pageCount: 45,
    uploadedAt: "2026-01-25T13:00:00Z",
    summary:
      "Revisits the seminal Michigan model of voting behaviour, updating the party identification framework with contemporary data on issue voting, economic voting, and the role of media.",
    mainArgument:
      "Party identification remains the strongest predictor of vote choice, but its stability has declined as issue salience, economic conditions, and media environments have become more variable.",
    keyConcepts: ["party identification", "Michigan model", "issue voting", "economic voting", "media effects"],
  },
  {
    id: "src_11",
    moduleId: "mod_04",
    folderId: "f_08",
    title: "Case Study Research: Principles and Practices",
    author: "John Gerring",
    year: 2017,
    type: "book_chapter",
    status: "processed",
    tags: ["case study", "research methods", "qualitative methods", "methodology"],
    citation: "Gerring, J. (2017) Case Study Research: Principles and Practices. 2nd edn. Cambridge: Cambridge University Press. Ch. 1.",
    pageCount: 30,
    uploadedAt: "2026-02-01T10:00:00Z",
    summary:
      "Provides a rigorous framework for case study research in social science, defining what constitutes a case study, when it is appropriate, and how to ensure methodological rigour.",
    mainArgument:
      "Case study research, when properly designed with clear case selection rationale and within-case causal analysis, can produce findings as rigorous and generalisable as large-N quantitative studies.",
    keyConcepts: ["case selection", "within-case analysis", "causal inference", "most-likely case", "least-likely case", "methodological rigour"],
  },
  {
    id: "src_12",
    moduleId: "mod_02",
    folderId: "f_13",
    title: "Essay Draft 1: Majoritarian vs Consensus Democracy",
    author: "Alex Chen",
    year: 2026,
    type: "draft",
    status: "processed",
    tags: ["draft", "essay", "comparative politics", "democracy"],
    citation: "Chen, A. (2026) 'Majoritarian vs Consensus Democracy', PIRR30022 Draft 1. University of Edinburgh.",
    pageCount: 8,
    uploadedAt: "2026-04-10T15:00:00Z",
    summary:
      "First draft of comparative politics essay examining majoritarian and consensus democratic systems.",
    mainArgument: "Student draft — argues that consensus democracies produce more effective policy outcomes overall.",
    keyConcepts: ["student draft", "essay", "majoritarianism", "consensus democracy"],
  },
];

const mockCitedChunks: CitedChunk[] = [
  {
    chunkId: "chk_01",
    sourceId: "src_01",
    sourceTitle: "Patterns of Democracy",
    quote: "Consensus democracy is characterised by power-sharing, bargaining, and compromise rather than the concentration and exercise of power by a simple majority.",
    pageRange: "pp. 2-3",
  },
  {
    chunkId: "chk_02",
    sourceId: "src_02",
    sourceTitle: "Veto Players",
    quote: "The more veto players there are, and the greater the ideological distance between them, the more policy stability we should expect.",
    pageRange: "p. 19",
  },
  {
    chunkId: "chk_03",
    sourceId: "src_01",
    sourceTitle: "Patterns of Democracy",
    quote: "On the dimension of democratic quality, consensus democracy has a clear edge over majoritarian democracy.",
    pageRange: "p. 275",
  },
];

const mockLabels: MessageLabel[] = [
  { type: "source_supported", text: "Supported by uploaded sources" },
];

export const mockConversations: AIConversation[] = [
  {
    id: "conv_01",
    moduleId: "mod_02",
    title: "Lijphart vs Tsebelis: Key differences",
    scope: "selected_sources",
    mode: "source_grounded",
    createdAt: "2026-04-28T14:00:00Z",
    messages: [
      {
        id: "msg_01",
        role: "user",
        content: "What is the difference between Lijphart's consensus model and Tsebelis's veto player theory?",
        citedChunks: [],
        warnings: [],
        labels: [],
        followUpSuggestions: [],
        createdAt: "2026-04-28T14:00:00Z",
      },
      {
        id: "msg_02",
        role: "assistant",
        content: `**Lijphart's Consensus Model** and **Tsebelis's Veto Player Theory** both analyse how institutional structures shape democratic governance, but they operate at different analytical levels and ask different questions.

**Lijphart's Approach (Source-supported)**
Lijphart classifies democracies along a single majoritarian-consensus dimension. His framework focuses on ten institutional variables grouped into two dimensions: the executives-parties dimension (cabinet composition, party systems, electoral systems) and the federal-unitary dimension (constitutional design, bicameralism, judicial review). He argues that consensus democracies — characterised by power-sharing, proportional representation, and multi-party coalitions — produce better democratic outcomes. (Lijphart, 1999, pp. 2-3)

**Tsebelis's Approach (Source-supported)**
Tsebelis takes a more mechanistic approach. Rather than classifying regime types, he identifies "veto players" — individual or collective actors whose agreement is necessary to change policy. These can be institutional (e.g., a second chamber, a president) or partisan (e.g., coalition partners). His core claim is that more veto players with greater ideological distance between them leads to greater policy stability and a narrower range of feasible policy change. (Tsebelis, 2002, p. 19)

**Key Differences (Interpretation)**
1. **Level of analysis**: Lijphart classifies entire democratic systems; Tsebelis provides a micro-level mechanism for understanding policy outcomes within any system.
2. **Normative dimension**: Lijphart explicitly evaluates which model produces better democratic quality; Tsebelis makes no normative claims — he simply predicts policy stability.
3. **Flexibility**: Tsebelis's framework can be applied to both majoritarian and consensus systems, as even Westminster systems have veto players (e.g., the House of Lords, courts).
4. **Policy focus**: Lijphart emphasises broad democratic outcomes (representation, participation, equality); Tsebelis focuses specifically on policy stability and change.

**Essay relevance**: These two frameworks complement each other. For your essay, you could use Lijphart to classify systems and evaluate outcomes, then use Tsebelis to explain *why* consensus systems produce the policy outcomes they do — the mechanism behind Lijphart's typology.

**⚠️ Warning**: The current source base does not include a source that directly compares these two theorists. Adding a comparative analysis source would strengthen your essay's theoretical framework section.`,
        citedChunks: mockCitedChunks,
        warnings: [
          "The current source base does not include a source that directly compares these two theorists. Consider adding a comparative source.",
        ],
        labels: mockLabels,
        followUpSuggestions: [
          "How does Tsebelis's theory explain policy change in consensus systems?",
          "What does Lijphart say about the relationship between consensus democracy and policy effectiveness?",
          "Can you help me structure an essay section comparing these two frameworks?",
          "What sources would I need to strengthen this comparison?",
        ],
        createdAt: "2026-04-28T14:01:00Z",
      },
    ],
  },
  {
    id: "conv_02",
    moduleId: "mod_01",
    title: "Great power politics essay planning",
    scope: "essay_project",
    mode: "essay_planning",
    createdAt: "2026-04-25T10:00:00Z",
    messages: [
      {
        id: "msg_03",
        role: "user",
        content: "Help me plan an essay on whether the return of great power politics has changed the international security environment.",
        citedChunks: [],
        warnings: [],
        labels: [],
        followUpSuggestions: [],
        createdAt: "2026-04-25T10:00:00Z",
      },
      {
        id: "msg_04",
        role: "assistant",
        content: `Here's a suggested essay structure based on your uploaded sources:

**Essay Plan: Great Power Politics and International Security**

**Thesis options:**
1. The return of great power competition has fundamentally altered the international security environment by reviving nuclear brinkmanship, undermining multilateral institutions, and creating new domains of conflict (cyber, space).
2. While great power competition has intensified, the international security environment retains significant continuities with the post-Cold War era, particularly in institutional frameworks and economic interdependence.

**Recommended structure:**

**I. Introduction (300 words)**
- Define "great power politics" and "international security environment"
- State your thesis
- Preview your argument structure

**II. The Case for Transformation (800 words)**
- Layne's structural realist argument about the return of multipolarity (Source-supported: Layne, 2018)
- Nuclear deterrence challenges in a new era (Source-supported: Lieber & Press, 2020)
- New domains of competition: cyber, space, AI

**III. The Case for Continuity (800 words)**
- Institutional resilience: NATO, UN, arms control frameworks
- Economic interdependence as a constraint on great power conflict
- Richardson's argument about hybrid contestation rather than system change (Source-supported: Richardson, 2026)

**IV. Critical Assessment (700 words)**
- Which dimension is more significant: transformation or continuity?
- Is this truly a "return" or something new?
- **Gap**: Your current sources don't address the Global South perspective on great power competition

**V. Conclusion (400 words)**

**Evidence gaps identified:**
1. No source on China's perspective on great power relations
2. No source on the impact on smaller/non-aligned states
3. No counter-argument source from a liberal institutionalist perspective

**⚠️ Note**: This plan uses your available sources but identifies significant gaps. A stronger essay would need 2-3 additional sources to address counterarguments and provide non-Western perspectives.`,
        citedChunks: [
          {
            chunkId: "chk_04",
            sourceId: "src_07",
            sourceTitle: "The Return of Great Power Politics",
            quote: "The return of great power politics is not a choice but a structural inevitability of the changing distribution of power in the international system.",
            pageRange: "p. 54",
          },
          {
            chunkId: "chk_05",
            sourceId: "src_08",
            sourceTitle: "Nuclear Deterrence in a New Era",
            quote: "The stability-instability paradox that governed Cold War nuclear dynamics may not hold in an era of precision conventional weapons and cyber vulnerabilities.",
            pageRange: "p. 12",
          },
        ],
        warnings: [
          "Your current sources don't address the Global South perspective on great power competition.",
          "No liberal institutionalist counter-argument source available.",
        ],
        labels: [{ type: "interpretation", text: "Essay structure based on interpretation of available sources" }],
        followUpSuggestions: [
          "Develop section II in more detail",
          "Help me find sources for the identified gaps",
          "Generate a thesis statement",
          "Create an evidence bank for this essay",
        ],
        createdAt: "2026-04-25T10:02:00Z",
      },
    ],
  },
];

const mockRubric: RubricCriterion[] = [
  { name: "Argument Clarity", description: "Clear, focused, and consistently argued thesis with logical progression", weight: 25 },
  { name: "Theoretical Understanding", description: "Accurate and sophisticated use of relevant theories and concepts", weight: 20 },
  { name: "Use of Evidence", description: "Effective and appropriate use of academic sources to support claims", weight: 20 },
  { name: "Structure and Organisation", description: "Well-organised essay with coherent structure and effective signposting", weight: 15 },
  { name: "Critical Analysis", description: "Independent critical thinking and evaluation of arguments", weight: 15 },
  { name: "Referencing and Presentation", description: "Accurate citations, bibliography, and professional presentation", weight: 5 },
];

const mockEssaySections: EssaySection[] = [
  {
    id: "sec_01",
    heading: "Introduction",
    points: [
      "Define majoritarian and consensus democracy using Lijphart's typology",
      "Introduce the policy effectiveness question",
      "State thesis: consensus democracies produce more durable and effective policy outcomes, though with trade-offs in decisiveness",
    ],
    evidenceIds: ["ev_01"],
    wordAllocation: 300,
  },
  {
    id: "sec_02",
    heading: "Theoretical Framework: Lijphart and Tsebelis",
    points: [
      "Outline Lijphart's consensus-majoritarian dimension",
      "Introduce Tsebelis's veto player theory as a complementary mechanism",
      "Explain how veto player theory explains policy stability in consensus systems",
    ],
    evidenceIds: ["ev_01", "ev_02"],
    wordAllocation: 600,
  },
  {
    id: "sec_03",
    heading: "Policy Effectiveness in Consensus Democracies",
    points: [
      "Lijphart's evidence on democratic quality indicators",
      "Policy durability and legitimacy in power-sharing systems",
      "Case study: Netherlands or Germany",
    ],
    evidenceIds: ["ev_01", "ev_03"],
    wordAllocation: 700,
  },
  {
    id: "sec_04",
    heading: "Policy Effectiveness in Majoritarian Democracies",
    points: [
      "Decisiveness as a majoritarian advantage",
      "Policy volatility and the 'electoral despotism' critique",
      "Case study: UK under Westminster model",
    ],
    evidenceIds: ["ev_04"],
    wordAllocation: 600,
  },
  {
    id: "sec_05",
    heading: "Critical Assessment",
    points: [
      "Can the two models be clearly distinguished in practice?",
      "Qvortrup's argument about the decline of consensus democracy",
      "Hybrid systems and the limitations of the typology",
    ],
    evidenceIds: ["ev_05"],
    wordAllocation: 500,
  },
  {
    id: "sec_06",
    heading: "Conclusion",
    points: [
      "Summarise the comparative evidence",
      "Acknowledge trade-offs between decisiveness and durability",
      "Suggest that the question of 'better' depends on the valued outcome",
    ],
    evidenceIds: [],
    wordAllocation: 300,
  },
];

const mockEvidence: EvidenceItem[] = [
  {
    id: "ev_01",
    sourceId: "src_01",
    sourceTitle: "Patterns of Democracy",
    quote: "Consensus democracy is characterised by power-sharing, bargaining, and compromise rather than the concentration and exercise of power by a simple majority.",
    pageRange: "pp. 2-3",
    argumentUse: "Establishing Lijphart's typology and its core characteristics",
  },
  {
    id: "ev_02",
    sourceId: "src_02",
    sourceTitle: "Veto Players",
    quote: "The more veto players there are, and the greater the ideological distance between them, the more policy stability we should expect.",
    pageRange: "p. 19",
    argumentUse: "Explaining the mechanism behind policy stability in consensus systems",
  },
  {
    id: "ev_03",
    sourceId: "src_01",
    sourceTitle: "Patterns of Democracy",
    quote: "On the dimension of democratic quality, consensus democracy has a clear edge over majoritarian democracy.",
    pageRange: "p. 275",
    argumentUse: "Supporting the claim that consensus systems produce better outcomes",
  },
  {
    id: "ev_04",
    sourceId: "src_04",
    sourceTitle: "Week 4 Lecture: Comparing Westminster and Consensus Models",
    quote: "The Westminster model's single-party majority government enables rapid policy change, but at the cost of exclusion and potential policy reversal.",
    pageRange: "Slide 14",
    argumentUse: "Presenting the majoritarian advantage in decisiveness and its trade-offs",
  },
  {
    id: "ev_05",
    sourceId: "src_03",
    sourceTitle: "The Rise and Fall of Consensus Democracy in Western Europe",
    quote: "Consensus democracy in Western Europe has been in decline since the early 2000s, challenged by populist movements, party system fragmentation, and declining trust.",
    pageRange: "p. 318",
    argumentUse: "Critiquing the durability of the consensus model in contemporary conditions",
  },
];

const mockCounterarguments: Counterargument[] = [
  {
    id: "ca_01",
    claim: "Consensus systems are too slow to respond to crises",
    sourceId: "src_04",
    sourceTitle: "Week 4 Lecture",
    rebuttal: "While decision-making is slower, the policies produced have broader legitimacy and are less likely to be reversed after elections.",
  },
  {
    id: "ca_02",
    claim: "Majoritarian systems produce clearer accountability",
    sourceId: "src_01",
    sourceTitle: "Patterns of Democracy",
    rebuttal: "Accountability in majoritarian systems may be clear but exclusionary — large minorities may have no representation in government.",
  },
];

const mockGaps: ResearchGap[] = [
  {
    id: "gap_01",
    description: "No source on recent UK policy performance post-Brexit to assess majoritarian effectiveness",
    severity: "high",
    suggestedSourceType: "Recent journal article on UK governance post-2020",
  },
  {
    id: "gap_02",
    description: "No counter-argument source from a majoritarian democracy advocate",
    severity: "medium",
    suggestedSourceType: "Norris (2011) or similar defence of majoritarian governance",
  },
  {
    id: "gap_03",
    description: "Limited non-Western European evidence",
    severity: "low",
    suggestedSourceType: "Comparative study including non-European democracies",
  },
];

export const mockEssayProject: EssayProject = {
  id: "essay_01",
  moduleId: "mod_02",
  title: "Majoritarianism vs Consensus Democracy",
  question:
    "Compare majoritarian with consensus democracies: which system better delivers effective government and effective policy-making?",
  wordCount: 3000,
  dueDate: "2026-05-15T23:59:00Z",
  rubric: mockRubric,
  selectedSourceIds: ["src_01", "src_02", "src_03", "src_04", "src_05", "src_06"],
  thesis:
    "While majoritarian democracies offer greater decisiveness, consensus democracies produce more durable, legitimate, and broadly effective policy outcomes — though this advantage is increasingly challenged by populist pressures and institutional erosion.",
  status: "drafting",
  structure: mockEssaySections,
  evidenceBank: mockEvidence,
  counterarguments: mockCounterarguments,
  gaps: mockGaps,
  draftContent: `Majoritarian and consensus democracies represent two fundamentally different approaches to democratic governance, each with distinct implications for government effectiveness and policy-making. This essay argues that while majoritarian systems offer greater decisiveness and clarity of accountability, consensus democracies produce more durable, legitimate, and broadly effective policy outcomes — though this advantage faces contemporary challenges from populist pressures and institutional erosion.

Lijphart's (1999) seminal work provides the foundational typology for comparing these systems. He identifies consensus democracy as characterised by power-sharing, proportional representation, multi-party coalitions, and balanced executive-legislative relations, in contrast to the concentration of power typical of majoritarian systems. Complementing this, Tsebelis's (2002) veto player theory offers a mechanistic explanation: consensus systems contain more veto players, which increases policy stability but may slow decision-making. [...]`,
};

export const mockDraftReview: DraftReview = {
  id: "dr_01",
  draftId: "src_12",
  strengths: [
    "Clear thesis statement that establishes the essay's argument",
    "Effective use of Lijphart's typology in the theoretical framework",
    "Good integration of Tsebelis's veto player theory as a complementary lens",
    "Logical essay structure with clear progression",
  ],
  weaknesses: [
    "The section on majoritarian advantages is underdeveloped — only 400 words against 700 for consensus",
    "The critical assessment section does not sufficiently engage with Qvortrup's argument",
    "Introduction could be more specific about what 'effective' government means",
    "Missing transitional paragraphs between sections",
  ],
  missingEvidence: [
    "No evidence cited for UK policy performance claims",
    "The Netherlands/Germany case study is mentioned but no specific policy examples given",
    "No source addresses the counter-argument that consensus systems fail during crises",
  ],
  unsupportedClaims: [
    "Paragraph 4 claims that 'majoritarian systems consistently produce faster policy responses' — no source cited",
    "The conclusion's claim about 'increasingly challenged by populist pressures' needs a citation beyond Qvortrup",
  ],
  revisionPriorities: [
    "Add specific policy examples to the case study sections",
    "Expand the majoritarian section to balance the argument",
    "Strengthen the critical assessment with deeper engagement with Qvortrup",
    "Add 2-3 more sources to address identified gaps",
    "Define 'effective government' more precisely in the introduction",
  ],
  estimatedBandRisk: "B+/A- range. Strong foundation but needs more evidence and balance to reach A.",
  overallFeedback:
    "This is a solid first draft with a clear argument and good theoretical grounding. The main areas for improvement are: (1) balancing the treatment of both democratic models, (2) adding specific empirical evidence to support claims, and (3) deepening the critical assessment. With these revisions, this essay has the potential for a strong mark.",
};

export const mockTools: AcademicTool[] = [
  {
    id: "reading_summary",
    title: "Reading Summary",
    description: "Generate a structured summary of a reading including main argument, key concepts, evidence, and limitations.",
    inputType: "One or more selected sources",
    outputType: "Structured reading summary",
    icon: "BookOpen",
    academicIntegrityNote: "Summaries help you understand readings. They do not replace reading the original text.",
  },
  {
    id: "concept_extractor",
    title: "Key Concept Extractor",
    description: "Identify and explain key concepts, theories, and terminology from selected sources.",
    inputType: "One or more selected sources",
    outputType: "Concept cards with definitions and source references",
    icon: "Lightbulb",
    academicIntegrityNote: "Concept extraction aids understanding. Always verify definitions against original sources.",
  },
  {
    id: "theory_comparison",
    title: "Theory Comparison",
    description: "Compare two or more theories or frameworks, identifying similarities, differences, and points of tension.",
    inputType: "Two or more sources with different theoretical perspectives",
    outputType: "Structured comparison table with analysis",
    icon: "GitCompareArrows",
    academicIntegrityNote: "Theory comparison is an analytical tool. Your essay should present your own comparative argument.",
  },
  {
    id: "literature_matrix",
    title: "Literature Matrix",
    description: "Create a structured matrix showing how different sources relate to key themes, questions, or variables.",
    inputType: "Multiple sources from a folder or selection",
    outputType: "Comparison matrix with source-grounded entries",
    icon: "Table",
    academicIntegrityNote: "Literature matrices help organise your reading. They support but do not replace your own synthesis.",
  },
  {
    id: "evidence_bank",
    title: "Evidence Bank",
    description: "Extract and organise key evidence, quotes, and data points from your sources by theme or argument.",
    inputType: "Selected sources or folder",
    outputType: "Organised evidence collection with citations",
    icon: "Database",
    academicIntegrityNote: "Evidence banks help organise source material. All quotes must be properly cited in final work.",
  },
  {
    id: "argument_map",
    title: "Argument Map",
    description: "Visualise the structure of an argument including claims, evidence, counterarguments, and conclusions.",
    inputType: "Essay plan or draft",
    outputType: "Structured argument map",
    icon: "Network",
    academicIntegrityNote: "Argument mapping is a planning tool. The final argument must be your own intellectual work.",
  },
  {
    id: "essay_plan_builder",
    title: "Essay Plan Builder",
    description: "Generate a structured essay plan based on your question, available sources, and chosen thesis.",
    inputType: "Essay question and selected sources",
    outputType: "Structured essay outline with evidence allocation",
    icon: "FileText",
    academicIntegrityNote: "Essay plans are planning tools. The writing and argument must be your own original work.",
  },
  {
    id: "counterargument_finder",
    title: "Counterargument Finder",
    description: "Identify potential counterarguments to your thesis and suggest evidence-based responses.",
    inputType: "Thesis statement and sources",
    outputType: "Counterarguments with suggested rebuttals",
    icon: "Swords",
    academicIntegrityNote: "Identifying counterarguments strengthens your essay. Your response to them must be your own reasoning.",
  },
  {
    id: "draft_review",
    title: "Draft Review",
    description: "Review your draft against marking criteria, identifying strengths, weaknesses, and areas for improvement.",
    inputType: "Draft text and marking rubric",
    outputType: "Structured feedback with revision priorities",
    icon: "MessageSquareText",
    academicIntegrityNote: "Draft review provides feedback to improve your work. It does not rewrite or complete your essay for you.",
  },
  {
    id: "citation_safety_check",
    title: "Citation Safety Check",
    description: "Check your text for claims that may lack proper citation support or risk misattributing sources.",
    inputType: "Draft text",
    outputType: "Citation audit with supported and unsupported claims flagged",
    icon: "ShieldCheck",
    academicIntegrityNote: "This tool helps prevent accidental misattribution. You remain responsible for citation accuracy.",
  },
  {
    id: "research_gap_finder",
    title: "Research Gap Finder",
    description: "Analyse your source base and essay plan to identify missing evidence, unaddressed perspectives, and gaps.",
    inputType: "Essay plan and source list",
    outputType: "Gap analysis with suggested source types",
    icon: "Search",
    academicIntegrityNote: "Gap analysis helps strengthen your research. It does not replace your own critical evaluation of the literature.",
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

export function getSourceById(id: string): SourceFile | undefined {
  return mockSources.find((s) => s.id === id);
}

export function getModuleById(id: string): Module | undefined {
  return mockModules.find((m) => m.id === id);
}

export function getSourcesForModule(moduleId: string): SourceFile[] {
  return mockSources.filter((s) => s.moduleId === moduleId);
}

export function getFoldersForModule(moduleId: string): Folder[] {
  return mockFolders.filter((f) => f.moduleId === moduleId);
}

export function getSourcesForFolder(folderId: string): SourceFile[] {
  return mockSources.filter((s) => s.folderId === folderId);
}
