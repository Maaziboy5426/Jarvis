import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Mail, Briefcase, FileCode } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'resume-formatter',
    title: 'Resume Formatter',
    category: 'Career',
    desc: 'Normalize headings, spacing, and bullet structure for resumes.',
    icon: FileText,
    usedCount: 7,
    action: 'format',
    task: 'Format this resume by normalizing all headings, standardizing bullet point structure, fixing spacing and alignment, and ensuring consistent font-size representation throughout. Output a clean, ATS-friendly resume layout.',
    fileTypes: '.pdf, .docx, .txt',
    hint: 'Upload your resume (PDF, DOCX, or TXT)',
  },
  {
    id: 'weekly-report-cleaner',
    title: 'Weekly Report Cleaner',
    category: 'Reporting',
    desc: 'Strip noise and reformat weekly status reports.',
    icon: FileText,
    usedCount: 5,
    action: 'cleanup',
    task: 'Clean up this weekly status report by removing redundant filler text, restructuring it into clear sections (Completed, In Progress, Blockers, Next Steps), and normalizing the formatting for executive readability.',
    fileTypes: '.pdf, .docx, .txt',
    hint: 'Upload your weekly status report',
  },
  {
    id: 'sales-excel-formatter',
    title: 'Sales Excel Formatter',
    category: 'Spreadsheets',
    desc: 'Auto-format sales spreadsheets for dashboard-ready views.',
    icon: FileCode,
    usedCount: 6,
    action: 'format',
    task: 'Format this sales spreadsheet data by normalizing column headers, standardizing date and currency formats, removing duplicate rows, and restructuring the data into a clean, dashboard-ready layout with summary totals.',
    fileTypes: '.xlsx, .csv',
    hint: 'Upload your sales spreadsheet (XLSX or CSV)',
  },
  {
    id: 'academic-ppt-enhancer',
    title: 'Academic PPT Enhancer',
    category: 'Slides',
    desc: 'Polish academic slide decks with consistent structure.',
    icon: FileCode,
    usedCount: 4,
    action: 'rewrite',
    task: 'Rewrite and enhance this academic presentation by improving clarity of each slide\'s key message, ensuring consistent heading hierarchy, tightening bullet points to be concise and impactful, and adding transition suggestions between sections.',
    fileTypes: '.pptx, .pdf, .txt',
    hint: 'Upload your presentation file (PPTX or PDF)',
  },
  {
    id: 'pdf-to-summary-slide',
    title: 'PDF to Summary Slide',
    category: 'Slides',
    desc: 'Summarize PDFs into concise, slide-ready bullet points.',
    icon: FileText,
    usedCount: 8,
    action: 'summarize',
    task: 'Summarize this document into concise, slide-ready content. Extract the key points from each section and restructure them as slide titles with 3–5 supporting bullet points each. Output should be presentation-ready.',
    fileTypes: '.pdf, .docx, .txt',
    hint: 'Upload the PDF or document to convert into slides',
  },
  {
    id: 'invoice-table-cleaner',
    title: 'Invoice Table Cleaner',
    category: 'Finance',
    desc: 'Clean invoice tables and normalize numeric columns.',
    icon: FileCode,
    usedCount: 3,
    action: 'cleanup',
    task: 'Clean this invoice or table data by removing malformed rows, normalizing all numeric columns (amounts, quantities, totals) to consistent decimal formatting, standardizing date fields, and verifying that line item totals are arithmetically consistent.',
    fileTypes: '.xlsx, .csv, .pdf',
    hint: 'Upload your invoice spreadsheet or PDF',
  },
  {
    id: 'email-from-excel',
    title: 'Email Draft from Excel',
    category: 'Communication',
    desc: 'Draft outreach emails using data from Excel rows.',
    icon: Mail,
    usedCount: 6,
    action: 'rewrite',
    task: 'Using the data in this spreadsheet, draft personalized outreach email templates. For each row, generate a professional email body with a compelling subject line, a personalized opening, a clear value proposition, and a call-to-action.',
    fileTypes: '.xlsx, .csv',
    hint: 'Upload your contact/data spreadsheet (XLSX or CSV)',
  },
  {
    id: 'meeting-notes-formatter',
    title: 'Meeting Notes Formatter',
    category: 'Productivity',
    desc: 'Convert raw notes into structured agendas and action items.',
    icon: FileText,
    usedCount: 9,
    action: 'format',
    task: 'Format these raw meeting notes into a structured document with clear sections: Meeting Overview (date, attendees, objective), Discussion Points, Decisions Made, and Action Items (with owner and due date for each). Make the output ready to share with all stakeholders.',
    fileTypes: '.txt, .docx, .pdf',
    hint: 'Upload your raw meeting notes',
  },
  {
    id: 'budget-sheet-organizer',
    title: 'Budget Sheet Organizer',
    category: 'Finance',
    desc: 'Reorder and format budget spreadsheets for review.',
    icon: FileCode,
    usedCount: 4,
    action: 'format',
    task: 'Organize this budget spreadsheet by grouping line items into logical categories, sorting by spend amount, normalizing all currency columns, adding subtotals per category, and formatting the data for executive review with a clean summary section at the top.',
    fileTypes: '.xlsx, .csv',
    hint: 'Upload your budget spreadsheet (XLSX or CSV)',
  },
  {
    id: 'research-paper-polisher',
    title: 'Research Paper Polisher',
    category: 'Academic',
    desc: 'Improve clarity and flow of research paper drafts.',
    icon: FileText,
    usedCount: 5,
    action: 'rewrite',
    task: 'Polish this research paper draft by improving sentence clarity and academic tone, fixing passive-voice overuse, tightening verbose paragraphs, improving section transitions, and ensuring the abstract, introduction, and conclusion are well-aligned. Preserve all technical terminology.',
    fileTypes: '.pdf, .docx, .txt',
    hint: 'Upload your research paper draft',
  },
  {
    id: 'contract-key-clause',
    title: 'Contract Key Clause Extractor',
    category: 'Legal',
    desc: 'Extract obligations and key clauses from contracts.',
    icon: FileText,
    usedCount: 8,
    action: 'summarize',
    task: 'Extract and summarize all key clauses from this contract. Identify and list: Parties involved, Effective date and term, Payment obligations, Termination conditions, Liability and indemnification clauses, Confidentiality provisions, and any unusual or high-risk clauses. Present findings in a structured table.',
    fileTypes: '.pdf, .docx',
    hint: 'Upload your contract (PDF or DOCX)',
  },
  {
    id: 'company-data-enricher',
    title: 'Company Data Enricher',
    category: 'Data',
    desc: 'Enrich company lists with clean, standardized fields.',
    icon: FileCode,
    usedCount: 2,
    action: 'cleanup',
    task: 'Clean and enrich this company dataset by standardizing company name casing, normalizing country and industry fields using standard classifications, flagging duplicate entries, correcting obvious data entry errors, and restructuring columns into a clean, consistent schema.',
    fileTypes: '.xlsx, .csv',
    hint: 'Upload your company data list (XLSX or CSV)',
  },
  {
    id: 'project-timeline-builder',
    title: 'Project Timeline Builder',
    category: 'Project',
    desc: 'Turn milestones into a clean, dated project plan.',
    icon: FileText,
    usedCount: 6,
    action: 'format',
    task: 'Convert this project information into a structured project plan. Extract or generate: Project phases, Milestones with target dates, Task dependencies, Owner assignments per task, and a concise Risk register. Format the output as a Gantt-style narrative plan ready for stakeholder review.',
    fileTypes: '.txt, .docx, .xlsx, .pdf',
    hint: 'Upload your project notes or milestone list',
  },
  {
    id: 'newsletter-generator',
    title: 'Newsletter Generator',
    category: 'Communication',
    desc: 'Transform notes into a send-ready newsletter draft.',
    icon: Mail,
    usedCount: 7,
    action: 'rewrite',
    task: 'Transform these notes or raw content into a polished, send-ready newsletter. Include: An engaging subject line, A warm introduction, 2–4 clearly structured content sections with headlines, A featured highlight or call-to-action block, and a concise closing with next steps or upcoming events.',
    fileTypes: '.txt, .docx, .pdf',
    hint: 'Upload your newsletter notes or draft content',
  },
  {
    id: 'presentation-brand-styler',
    title: 'Presentation Brand Styler',
    category: 'Slides',
    desc: 'Normalize headings and tone for on-brand decks.',
    icon: FileCode,
    usedCount: 3,
    action: 'format',
    task: 'Normalize the tone and structure of this presentation for brand consistency. Standardize all heading styles, align the language to a professional corporate tone, rewrite overly casual or inconsistent slides, and ensure every slide has a clear headline and 3–5 concise bullets.',
    fileTypes: '.pptx, .pdf, .txt',
    hint: 'Upload your presentation file (PPTX, PDF, or TXT)',
  },
  {
    id: 'data-cleanup-auto-script',
    title: 'Data Cleanup Auto Script',
    category: 'Data',
    desc: 'Detect and fix obvious formatting issues in data dumps.',
    icon: FileCode,
    usedCount: 9,
    action: 'cleanup',
    task: 'Perform a full cleanup pass on this data file. Detect and fix: Inconsistent delimiters or spacing, Mixed casing in categorical fields, Null/empty fields, Duplicate rows, Malformed dates or numbers, and Non-ASCII or special characters. Provide a summary of all changes made.',
    fileTypes: '.csv, .xlsx, .json, .txt',
    hint: 'Upload your raw data file (CSV, XLSX, JSON, or TXT)',
  },
  {
    id: 'survey-result-formatter',
    title: 'Survey Result Formatter',
    category: 'Reporting',
    desc: 'Format survey exports into readable tables and bullets.',
    icon: FileCode,
    usedCount: 4,
    action: 'format',
    task: 'Format this survey export into a professional results report. Group responses by question, calculate response distributions, highlight the top themes in open-ended responses, and present findings in clean tables with percentage breakdowns and key takeaway bullets for each question.',
    fileTypes: '.csv, .xlsx',
    hint: 'Upload your survey export (CSV or XLSX)',
  },
  {
    id: 'hr-attendance-processor',
    title: 'HR Attendance Processor',
    category: 'HR',
    desc: 'Standardize HR attendance logs for downstream reporting.',
    icon: FileCode,
    usedCount: 5,
    action: 'cleanup',
    task: 'Clean and standardize this HR attendance log. Normalize date/time formats, flag missing punch-in or punch-out entries, calculate total hours worked per employee per day, identify employees with attendance below threshold, and restructure the data for downstream HR reporting.',
    fileTypes: '.xlsx, .csv',
    hint: 'Upload your attendance log spreadsheet',
  },
  {
    id: 'financial-report-summarizer',
    title: 'Financial Report Summarizer',
    category: 'Finance',
    desc: 'Generate executive-ready summaries from financial PDFs.',
    icon: FileText,
    usedCount: 8,
    action: 'summarize',
    task: 'Summarize this financial report into an executive-ready brief. Extract: Key revenue and expense figures, Year-over-year or period-over-period performance deltas, Notable risks or opportunities called out in the report, Management commentary highlights, and a 3-bullet executive summary of overall financial health.',
    fileTypes: '.pdf, .docx',
    hint: 'Upload your financial report (PDF or DOCX)',
  },
  {
    id: 'proposal-professional-rewrite',
    title: 'Proposal Professional Rewrite',
    category: 'Business',
    desc: 'Rewrite proposals for a more polished, consistent tone.',
    icon: FileText,
    usedCount: 6,
    action: 'rewrite',
    task: 'Rewrite this proposal with a polished, professional tone. Improve the executive summary, tighten the problem statement, make the proposed solution more compelling and concrete, sharpen the value proposition, and ensure pricing or timeline sections are clear and credible. Maintain all original facts and figures.',
    fileTypes: '.pdf, .docx, .txt',
    hint: 'Upload your proposal document',
  },
  {
    id: 'csv-column-standardizer',
    title: 'CSV Column Standardizer',
    category: 'Data',
    desc: 'Align header naming, casing, and ordering in CSV files.',
    icon: FileCode,
    usedCount: 3,
    action: 'cleanup',
    task: 'Standardize the columns in this CSV file. Convert all column headers to snake_case, remove special characters from headers, reorder columns logically (ID fields first, then descriptive fields, then metrics), drop fully empty columns, and flag any columns with more than 20% missing values.',
    fileTypes: '.csv',
    hint: 'Upload your CSV file',
  },
  {
    id: 'slide-consistency-fixer',
    title: 'Slide Consistency Fixer',
    category: 'Slides',
    desc: 'Enforce consistent titles and bullet styles in slides.',
    icon: FileCode,
    usedCount: 4,
    action: 'format',
    task: 'Fix consistency issues in this presentation. Ensure all slide titles follow the same capitalization style, all bullet points use parallel grammatical structure, slide numbering is consistent, and the deck has a logical flow (intro → content → conclusion). Flag any slides that feel out of place or incomplete.',
    fileTypes: '.pptx, .pdf, .txt',
    hint: 'Upload your presentation file',
  },
  {
    id: 'document-header-normalizer',
    title: 'Document Header Normalizer',
    category: 'Documentation',
    desc: 'Normalize heading levels and spacing in long docs.',
    icon: FileText,
    usedCount: 7,
    action: 'format',
    task: 'Normalize the heading structure and spacing in this long document. Enforce a consistent heading hierarchy (H1 → H2 → H3), standardize spacing before and after each section, ensure no heading is skipped, and add a generated Table of Contents at the top. Fix any orphan headings with missing content.',
    fileTypes: '.docx, .pdf, .txt',
    hint: 'Upload your long-form document',
  },
  {
    id: 'analytics-chart-generator',
    title: 'Analytics Chart Generator',
    category: 'Reporting',
    desc: 'Summarize analytics exports into chart-ready narratives.',
    icon: FileCode,
    usedCount: 2,
    action: 'summarize',
    task: 'Analyze this analytics export and produce a chart-ready narrative report. Identify the top-performing metrics, surface trends and anomalies, produce a narrative description for each key chart (suitable as chart annotations or captions), and write a 5-bullet executive summary of the most actionable insights.',
    fileTypes: '.csv, .xlsx',
    hint: 'Upload your analytics export (CSV or XLSX)',
  },
  {
    id: 'monthly-report-packager',
    title: 'Monthly Report Packager',
    category: 'Reporting',
    desc: 'Bundle monthly metrics into a clean narrative summary.',
    icon: FileText,
    usedCount: 10,
    action: 'summarize',
    task: 'Package this monthly data into a polished narrative summary report. Structure it with: A one-paragraph executive summary, Performance vs. targets for each key metric, Notable highlights and lowlights, Root-cause commentary for any significant misses, and Recommended actions for the next month. Format for leadership distribution.',
    fileTypes: '.xlsx, .csv, .pdf, .docx',
    hint: 'Upload your monthly data or report draft',
  },
];

const filters = ['All', 'Communication', 'Business', 'Reporting', 'Spreadsheets', 'Slides', 'Finance', 'Academic', 'Legal', 'Data', 'HR', 'Project', 'Career', 'Documentation'];

const TemplateCard = ({ title, category, desc, icon: IconComponent, usedCount, fileTypes, onApply }) => (
  <div className="glass-panel floating" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ padding: '0.65rem', background: 'rgba(108,110,255,0.12)', borderRadius: '10px' }}>
        {React.createElement(IconComponent, { size: 22, color: 'var(--accent-primary)' })}
      </div>
      <div className="chip">{category}</div>
    </div>
    <h3 style={{ marginBottom: '0.35rem' }}>{title}</h3>
    <p style={{ fontSize: '0.95rem', marginBottom: '0.75rem', flex: 1 }}>{desc}</p>
    {fileTypes && (
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono, monospace)', background: 'rgba(108,110,255,0.07)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
        📎 {fileTypes}
      </div>
    )}
    <div className="flex-between">
      <span className="muted" style={{ fontSize: '0.85rem' }}>Used {usedCount} times</span>
      <button className="btn btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }} onClick={onApply}>
        Use Template
      </button>
    </div>
  </div>
);

const Templates = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = TEMPLATES.filter((t) => {
    const matchesFilter = activeFilter === 'All' || t.category === activeFilter;
    const matchesSearch = searchTerm === '' ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h1>Templates</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '320px' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search templates..."
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filters.map((filter) => (
            <button
              key={filter}
              className={`chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="card-grid-3">
        {filtered.map((item) => (
          <TemplateCard
            key={item.id}
            {...item}
            onApply={() =>
              navigate('/run-macro', {
                state: {
                  action: item.action,
                  fromTemplate: true,
                  templateId: item.id,
                  templateTitle: item.title,
                  templateDescription: item.desc,
                  templateTask: item.task,
                  templateFileTypes: item.fileTypes,
                  templateHint: item.hint,
                },
              })
            }
          />
        ))}
      </div>
    </div>
  );
};
export default Templates;
