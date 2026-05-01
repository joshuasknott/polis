import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const seed = mutation({
  args: { serverSecret: v.optional(v.string()) },
  handler: async (ctx, { serverSecret }) => {
    requireServerSecret(serverSecret);
    const now = new Date().toISOString();
    const demoPasswordHash = "c3996d55c493aa0b12c124af09aa494f:ea1219f59cca3f24d594c1419e527e0f4f29faaa23dadb9457566bf0ce9bf95d6746cec9a55228b896da7b6630a2cc3f21c3e05ba238b83ee4b07b4a7663edf8";
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", "alex.chen@university.ac.uk")).first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        emailVerified: existing.emailVerified ?? false,
        createdAt: existing.createdAt ?? now,
        updatedAt: now,
        passwordHash: demoPasswordHash,
      });

      const existingCredential = await ctx.db
        .query("accounts")
        .withIndex("by_providerId_and_accountId", (q) =>
          q.eq("providerId", "credential").eq("accountId", existing._id)
        )
        .first();

      if (!existingCredential) {
        await ctx.db.insert("accounts", {
          userId: existing._id,
          accountId: existing._id,
          providerId: "credential",
          password: demoPasswordHash,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(existingCredential._id, {
          password: demoPasswordHash,
          updatedAt: now,
        });
      }

      return "Demo user already seeded";
    }

    const userId = await ctx.db.insert("users", {
      name: "Alex Chen",
      email: "alex.chen@university.ac.uk",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      passwordHash: demoPasswordHash,
      university: "University of Edinburgh",
      course: "Politics and International Relations",
      yearOfStudy: 3,
      role: "student",
      preferences: "{}",
    });

    await ctx.db.insert("accounts", {
      userId,
      accountId: userId,
      providerId: "credential",
      password: demoPasswordHash,
      createdAt: now,
      updatedAt: now,
    });

    const modules = [
      { code: "PIRR30041", title: "International Security", description: "Examines the changing nature of international security, including great power competition, nuclear deterrence, cyber threats, and human security.", academicYear: "2025-26", semester: "Semester 1", colour: "#1e3a5f" },
      { code: "PIRR30022", title: "Comparative Government and Politics", description: "Compares democratic systems across countries, examining electoral systems, executive-legislative relations, federalism, and governance outcomes.", academicYear: "2025-26", semester: "Semester 1", colour: "#4a6741" },
      { code: "PIRR30055", title: "Elections and Voters", description: "Analyses electoral systems, voting behaviour, party competition, and the role of media and identity in shaping democratic choice.", academicYear: "2025-26", semester: "Semester 2", colour: "#7c3aed" },
      { code: "SSPS30010", title: "Research Methods", description: "Introduces qualitative and quantitative research methods for social science, including case study design, survey analysis, and ethical research practice.", academicYear: "2025-26", semester: "Semester 2", colour: "#b45309" },
    ];

    const moduleIds: Record<string, any> = {};
    for (const mod of modules) {
      const id = await ctx.db.insert("modules", { userId, ...mod });
      moduleIds[mod.code] = id;
    }

    const folderDefs = [
      { name: "Module Info", type: "module_info", displayOrder: 0 },
      { name: "Readings", type: "readings", displayOrder: 1 },
      { name: "Lecture and Seminar Material", type: "lectures", displayOrder: 2 },
      { name: "Source Notes", type: "source_notes", displayOrder: 3 },
      { name: "Essay Plans", type: "essay_plans", displayOrder: 4 },
      { name: "Drafts and Feedback", type: "drafts", displayOrder: 5 },
      { name: "Final Submission", type: "final_submission", displayOrder: 6 },
    ];

    const folderMap: Record<string, any> = {};
    for (const [, modId] of Object.entries(moduleIds)) {
      for (const fd of folderDefs) {
        const id = await ctx.db.insert("folders", { moduleId: modId, ...fd });
        const modCode = Object.entries(moduleIds).find(([, v]) => v === modId)?.[0];
        if (modCode) folderMap[`${modId}-${fd.type}`] = id;
      }
    }

    const sources = [
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-readings`], title: "Patterns of Democracy: Government Forms and Performance in Thirty-Six Countries", authors: "Arend Lijphart", year: 1999, type: "book_chapter", summary: "Lijphart presents a comprehensive comparison of consensus and majoritarian democracy models across 36 countries.", keyArguments: "Consensus democracy, characterised by power-sharing, produces better democratic outcomes.", concepts: "consensus democracy, majoritarian democracy, power-sharing", status: "ready", wordCount: 14400 },
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-readings`], title: "Veto Players: How Political Institutions Work", authors: "George Tsebelis", year: 2002, type: "book_chapter", summary: "Tsebelis develops a veto player theory of political institutions.", keyArguments: "More veto players with greater ideological distance leads to greater policy stability.", concepts: "veto players, policy stability, winset", status: "ready", wordCount: 18600 },
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-readings`], title: "The Rise and Fall of Consensus Democracy in Western Europe, 1945-2019", authors: "Matt Qvortrup", year: 2022, type: "journal_article", summary: "Traces the trajectory of consensus democracy in Western Europe.", keyArguments: "Consensus democracy in Western Europe has been in decline since the early 2000s.", concepts: "consensus democracy decline, populism", status: "ready", wordCount: 5400 },
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-lectures`], title: "Week 4 Lecture: Comparing Westminster and Consensus Models", authors: "Dr. Sarah Mitchell", year: 2026, type: "lecture_slides", summary: "Lecture comparing the Westminster majoritarian model with Lijphart's consensus model.", keyArguments: "The UK Westminster system is the archetypal majoritarian model.", concepts: "Westminster model, devolution", status: "ready", wordCount: 9600 },
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-essay_plans`], title: "Essay Brief: Majoritarianism vs Consensus Democracy", authors: "Course Convenor", year: 2026, type: "essay_brief", summary: "Essay assessment asking students to compare majoritarian and consensus democratic systems.", keyArguments: "N/A", concepts: "essay question, assessment criteria", status: "ready", wordCount: 900 },
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-module_info`], title: "PIRR30022 Marking Rubric", authors: "Course Convenor", year: 2026, type: "marking_rubric", summary: "Marking criteria for PIRR30022 essays.", keyArguments: "N/A", concepts: "marking criteria", status: "ready", wordCount: 600 },
      { moduleId: moduleIds["PIRR30041"], folderId: folderMap[`${moduleIds["PIRR30041"]}-readings`], title: "The Return of Great Power Politics", authors: "Christopher Layne", year: 2018, type: "journal_article", summary: "Layne argues that the return of great power rivalry is a structural inevitability.", keyArguments: "Great power competition is driven by structural shifts in the international system.", concepts: "great power competition, structural realism", status: "ready", wordCount: 4800 },
      { moduleId: moduleIds["PIRR30041"], folderId: folderMap[`${moduleIds["PIRR30041"]}-readings`], title: "Nuclear Deterrence in a New Era: Challenges and Adaptations", authors: "Keir Lieber & Daryl Press", year: 2020, type: "journal_article", summary: "Examines how emerging technologies challenge traditional nuclear deterrence frameworks.", keyArguments: "Advances in precision conventional weapons undermine MAD stability.", concepts: "nuclear deterrence, MAD, escalation", status: "ready", wordCount: 12600 },
      { moduleId: moduleIds["PIRR30041"], folderId: folderMap[`${moduleIds["PIRR30041"]}-lectures`], title: "Week 6 Lecture: Great Power Competition and Global Order", authors: "Prof. James Richardson", year: 2026, type: "lecture_slides", summary: "Lecture examining how great power competition is reshaping global security.", keyArguments: "Hybrid contestation is the more probable outcome.", concepts: "liberal international order, revisionist powers", status: "ready", wordCount: 8400 },
      { moduleId: moduleIds["PIRR30055"], folderId: folderMap[`${moduleIds["PIRR30055"]}-module_info`], title: "The American Voter Revisited", authors: "Lewis-Beck et al.", year: 2008, type: "book", summary: "Revisits the seminal Michigan model of voting behaviour.", keyArguments: "Party identification remains the strongest predictor of vote choice.", concepts: "party identification, Michigan model", status: "ready", wordCount: 13500 },
      { moduleId: moduleIds["SSPS30010"], folderId: folderMap[`${moduleIds["SSPS30010"]}-module_info`], title: "Case Study Research: Principles and Practices", authors: "John Gerring", year: 2017, type: "book_chapter", summary: "Provides a rigorous framework for case study research.", keyArguments: "Case study research can produce findings as rigorous as large-N studies.", concepts: "case selection, causal inference", status: "ready", wordCount: 9000 },
      { moduleId: moduleIds["PIRR30022"], folderId: folderMap[`${moduleIds["PIRR30022"]}-drafts`], title: "Essay Draft 1: Majoritarian vs Consensus Democracy", authors: "Alex Chen", year: 2026, type: "draft", summary: "First draft of comparative politics essay.", keyArguments: "Student draft", concepts: "student draft", status: "ready", wordCount: 2400 },
    ];

    for (const src of sources) {
      await ctx.db.insert("sources", { userId, ...src });
    }

    const essayId = await ctx.db.insert("essays", {
      userId,
      moduleId: moduleIds["PIRR30022"],
      title: "Majoritarianism vs Consensus Democracy",
      question: "Compare majoritarian with consensus democracies: which system better delivers effective government and effective policy-making?",
      thesis: "While majoritarian democracies offer greater decisiveness, consensus democracies produce more durable, legitimate, and broadly effective policy outcomes.",
      targetWordCount: 3000,
      status: "drafting",
    });

    const sections = [
      { essayId, title: "Introduction", purpose: "Define majoritarian and consensus democracy, introduce thesis", targetWordCount: 300, displayOrder: 0 },
      { essayId, title: "Theoretical Framework: Lijphart and Tsebelis", purpose: "Outline theoretical framework", targetWordCount: 600, displayOrder: 1 },
      { essayId, title: "Policy Effectiveness in Consensus Democracies", purpose: "Present evidence for consensus democracy effectiveness", targetWordCount: 700, displayOrder: 2 },
      { essayId, title: "Policy Effectiveness in Majoritarian Democracies", purpose: "Present the majoritarian advantage", targetWordCount: 600, displayOrder: 3 },
      { essayId, title: "Critical Assessment", purpose: "Critically assess both models", targetWordCount: 500, displayOrder: 4 },
      { essayId, title: "Conclusion", purpose: "Summarise and conclude", targetWordCount: 300, displayOrder: 5 },
    ];

    for (const sec of sections) {
      await ctx.db.insert("essaySections", sec);
    }

    return "Seed completed successfully!";
  },
});
