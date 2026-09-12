# Save this script as generate_deck.py and run:
# pip install python-pptx
# python generate_deck.py

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_sih_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Palette
    C_NAVY   = RGBColor(27, 42, 74)     # #1B2A4A - Primary Title & Accent
    C_ORANGE = RGBColor(235, 94, 40)    # #EB5E28 - India Saffron / SIH Accent
    C_GREEN  = RGBColor(42, 157, 143)   # #2A9D8F - India Green / Success Metric
    C_DARK   = RGBColor(33, 37, 41)     # #212529 - Body Text
    C_MUTED  = RGBColor(108, 117, 125)  # #6C757D - Captions & Subtitles
    C_BG_BOX = RGBColor(245, 247, 250)  # #F5F7FA - Card Background
    C_BORDER = RGBColor(218, 224, 233)  # #DAE0E9 - Border lines
    C_WHITE  = RGBColor(255, 255, 255)

    def add_header(slide, title_text, slide_num):
        # Category / Header Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.0), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = "SMART INDIA HACKATHON 2026 | IDEA SUBMISSION"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = C_ORANGE

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(9.5), Inches(0.8))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = C_NAVY

        # Slide Number Badge
        num_box = slide.shapes.add_textbox(Inches(11.8), Inches(0.4), Inches(0.8), Inches(0.6))
        tf_n = num_box.text_frame
        p_n = tf_n.paragraphs[0]
        p_n.text = str(slide_num)
        p_n.alignment = PP_ALIGN.RIGHT
        p_n.font.size = Pt(24)
        p_n.font.bold = True
        p_n.font.color.rgb = C_ORANGE

        # Top Accent Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = C_BORDER
        line.line.color.rgb = C_BORDER

    def add_footer(slide):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        tf = footer_box.text_frame
        p = tf.paragraphs[0]
        p.text = "Team Nexora | Problem Statement ID: 26032 | KrishiConnect"
        p.font.size = Pt(9)
        p.font.color.rgb = C_MUTED

    # ==========================================
    # SLIDE 1: TITLE PAGE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)

    # Left Decorative Colored Accent Bar
    bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.2), Inches(0.2), Inches(5.0))
    bar.fill.solid()
    bar.fill.fore_color.rgb = C_ORANGE
    bar.line.fill.background()

    # Main Heading Box
    tbox = s1.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(11.0), Inches(1.8))
    tf = tbox.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "SMART INDIA HACKATHON 2026"
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = C_ORANGE

    p2 = tf.add_paragraph()
    p2.text = "KrishiConnect"
    p2.font.size = Pt(40)
    p2.font.bold = True
    p2.font.color.rgb = C_NAVY

    p3 = tf.add_paragraph()
    p3.text = "Digital Mandi Queue & Fair Price Procurement Infrastructure"
    p3.font.size = Pt(18)
    p3.font.color.rgb = C_DARK

    # Details Card Table
    fields = [
        ("Problem Statement ID", "26032"),
        ("Theme", "Smart Agriculture / Food Security & Public Distribution System (PDS)"),
        ("PS Category", "Software with Physical Hardware Integration (Keypad GSM Carrier SMS)"),
        ("Ministry / Org", "Ministry of Consumer Affairs, Food & Public Distribution (DoCA)"),
        ("Team Name", "Nexora"),
        ("Team ID", "[Insert Registered Team ID on SIH Portal]")
    ]

    card_bg = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(3.3), Inches(11.3), Inches(3.2))
    card_bg.fill.solid()
    card_bg.fill.fore_color.rgb = C_BG_BOX
    card_bg.line.color.rgb = C_BORDER

    card_tb = s1.shapes.add_textbox(Inches(1.5), Inches(3.4), Inches(10.7), Inches(3.0))
    c_tf = card_tb.text_frame
    c_tf.word_wrap = True

    for i, (k, v) in enumerate(fields):
        p = c_tf.paragraphs[0] if i == 0 else c_tf.add_paragraph()
        run_k = p.add_run()
        run_k.text = f"{k.ljust(25)}:  "
        run_k.font.bold = True
        run_k.font.size = Pt(12)
        run_k.font.color.rgb = C_NAVY

        run_v = p.add_run()
        run_v.text = v
        run_v.font.size = Pt(12)
        run_v.font.color.rgb = C_DARK
        p.space_after = Pt(6)

    # ==========================================
    # SLIDE 2: PROPOSED SOLUTION
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "IDEA TITLE & PROPOSED SOLUTION", 2)
    add_footer(s2)

    col_w = Inches(3.75)
    col_h = Inches(5.1)
    col_y = Inches(1.75)

    # Column 1: Detailed Solution
    c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), col_y, col_w, col_h)
    c1.fill.solid()
    c1.fill.fore_color.rgb = C_BG_BOX
    c1.line.color.rgb = C_BORDER
    tb1 = s2.shapes.add_textbox(Inches(0.95), col_y + Inches(0.15), col_w - Inches(0.3), col_h - Inches(0.3))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "Detailed Proposed Solution"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(10)

    bullets1 = [
        "End-to-End Mandi Operating Grid: Replaces chaotic physical tractor arrivals with an algorithmic, predictable arrival pipeline.",
        "Dual-Channel Citizen Ingress: PWA for smartphones + 100% zero-internet Physical GSM Carrier SMS for Rs.1,000 keypad feature phones.",
        "Weighbridge & Assaying OS: Automated gate-pass barcode generation, dynamic tare/gross calculation, and real-time weighbridge routing.",
        "Instant DBT Settlement: Direct treasury payouts via PFMS/e-Kuber webhooks with statutory Form 'J' digital gazette generation."
    ]
    for b in bullets1:
        p = tf1.add_paragraph()
        p.text = f"• {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(8)

    # Column 2: How It Addresses the Problem
    c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.78), col_y, col_w, col_h)
    c2.fill.solid()
    c2.fill.fore_color.rgb = C_BG_BOX
    c2.line.color.rgb = C_BORDER
    tb2 = s2.shapes.add_textbox(Inches(4.93), col_y + Inches(0.15), col_w - Inches(0.3), col_h - Inches(0.3))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "How It Addresses The Problem"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(10)

    bullets2 = [
        "Eliminates 18h Highway Bottlenecks: Time-slotted entry scheduling throttles incoming grain volume according to weighbridge capacity.",
        "Neutralizes Middleman Cartels: Live e-NAM modal price ingestion detects distress selling points and directs farmers to fair MSP centers.",
        "Eliminates Subjective Moisture Cheating: Replaces manual fingernail inspection with calibrated digital probe grading.",
        "Ends Distress Rejection: Automated 2.5-hour courtyard sun-drying grace period preserves token priority for borderline lots."
    ]
    for b in bullets2:
        p = tf2.add_paragraph()
        p.text = f"• {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(8)

    # Column 3: Innovation & Novelty
    c3 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.76), col_y, col_w, col_h)
    c3.fill.solid()
    c3.fill.fore_color.rgb = C_BG_BOX
    c3.line.color.rgb = C_BORDER
    tb3 = s2.shapes.add_textbox(Inches(8.91), col_y + Inches(0.15), col_w - Inches(0.3), col_h - Inches(0.3))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p = tf3.paragraphs[0]
    p.text = "Innovation & Uniqueness"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = C_ORANGE
    p.space_after = Pt(10)

    bullets3 = [
        "Hardware-Validated 2G Telephony: Tested on physical Nokia/Samsung keypad phones in Bengali, Hindi, and English without internet.",
        "Predictive e-NAM Arrival Forecaster: 48-hour advance arrival prediction based on APMC wholesale price spreads vs MSP parity.",
        "Offline-First Edge Resiliency: Local SQLite/IndexedDB transactional queue functions reliably during remote rural network outages.",
        "Anti-Middleman Land Quota Cap: Enforces Max Quintals = Verified Land Area x Yield Per Acre ceiling directly at booking."
    ]
    for b in bullets3:
        p = tf3.add_paragraph()
        p.text = f"• {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(8)

    # ==========================================
    # SLIDE 3: TECHNICAL APPROACH
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "TECHNICAL APPROACH & METHODOLOGY", 3)
    add_footer(s3)

    # Top Section: Tech Stack Cards
    stack_w = Inches(2.78)
    stack_h = Inches(2.3)
    stack_y = Inches(1.75)

    stacks = [
        ("Client & Accessibility", ["Next.js 14 / React PWA", "GSM Carrier SMS Engine", "Bhashini Multi-lingual UI", "Keypad Phone Optimized"]),
        ("Backend & Concurrency", ["FastAPI (Python 3.11)", "Native Asynchronous I/O", "Row-Locking (SELECT FOR UPDATE)", "WebSockets (<100ms Sync)"]),
        ("Data & Spatial Engine", ["PostgreSQL / PostGIS", "SQLite Offline Local Mirror", "Haversine Proximity Matcher", "e-NAM Modal Ingestion"]),
        ("GovTech & Finance", ["PFMS / e-Kuber Webhook", "Statutory Form 'J' Engine", "Agmark FAQ Assaying Rules", "C-DAC SMS Gateway Std"])
    ]

    for i, (title, items) in enumerate(stacks):
        sx = Inches(0.8 + i * 2.98)
        box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, stack_y, stack_w, stack_h)
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_BOX
        box.line.color.rgb = C_BORDER

        tb = s3.shapes.add_textbox(sx + Inches(0.1), stack_y + Inches(0.1), stack_w - Inches(0.2), stack_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = C_NAVY
        p.space_after = Pt(6)

        for itm in items:
            p = tf.add_paragraph()
            p.text = f"• {itm}"
            p.font.size = Pt(9.5)
            p.font.color.rgb = C_DARK
            p.space_after = Pt(3)

    # Bottom Section: 4-Step Operational Pipeline
    pipe_y = Inches(4.25)
    pipe_w = Inches(11.733)
    pipe_h = Inches(2.6)

    p_bg = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), pipe_y, pipe_w, pipe_h)
    p_bg.fill.solid()
    p_bg.fill.fore_color.rgb = C_WHITE
    p_bg.line.color.rgb = C_NAVY

    tb_pipe = s3.shapes.add_textbox(Inches(1.0), pipe_y + Inches(0.15), pipe_w - Inches(0.4), pipe_h - Inches(0.3))
    tf_p = tb_pipe.text_frame
    tf_p.word_wrap = True

    p = tf_p.paragraphs[0]
    p.text = "4-Step Procurement Pipeline (Verified Physical Hardware & Code Prototype)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(8)

    steps = [
        "1. Dynamic GPS Booking & Quota Check: Farmer initiates booking via PWA or GSM SMS. System runs Haversine route sorting across nearest Mandis and caps tonnage against verified landholding records to block middleman spoofing.",
        "2. Gate Arrival & Weighbridge Sync: Tractor arrives at allotted slot. Gate assayer scans dynamic QR/SMS token. WebSocket server assigns weighbridge bay, records vehicle gross weight, and syncs queue position across all dashboards.",
        "3. Three-Way Moisture Decision Matrix: Digital probe reads grain moisture %: (a) <=17%: Auto-approved at statutory MSP; (b) 17.1-19.9%: Automatic 2.5h courtyard sun-drying deferral issued with preserved queue priority; (c) >=20%: Formal safety rejection.",
        "4. Net Weight & Instant DBT Payout: Empty tractor weighs tare weight. Net quintals computed automatically. PFMS/e-Kuber webhook authorizes direct bank transfer, generating a QR-verifiable statutory Form 'J' receipt."
    ]

    for s in steps:
        p = tf_p.add_paragraph()
        p.text = s
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(4)

    # ==========================================
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "FEASIBILITY AND VIABILITY ANALYSIS", 4)
    add_footer(s4)

    # Top: Feasibility Pillars
    f_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.75), Inches(11.733), Inches(1.6))
    f_box.fill.solid()
    f_box.fill.fore_color.rgb = C_BG_BOX
    f_box.line.color.rgb = C_BORDER
    tf_f = f_box.text_frame
    tf_f.word_wrap = True

    p = tf_f.paragraphs[0]
    p.text = "Operational & Economic Feasibility Pillars"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(6)

    feas_points = [
        "Zero Capex for Marginal Farmers: Operates completely on legacy 2G GSM cellular networks using standard pre-approved SMS templates; zero hardware upgrade required.",
        "Turnkey Mandi Onboarding: Weighbridge terminals only require a standard web browser on existing PCs/tablets; communicates directly with electronic scale heads via RS-232 serial/HTTP.",
        "Policy & Gazette Compliance: Architecture engineered strictly according to CACP MSP formulas, APMC Model Acts, and DMI Agmark Fair Average Quality (FAQ) standards."
    ]
    for fp in feas_points:
        p = tf_f.add_paragraph()
        p.text = f"• {fp}"
        p.font.size = Pt(10)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(4)

    # Bottom: Challenges vs Mitigations Table
    t_y = Inches(3.55)
    tbl_shape = s4.shapes.add_table(5, 2, Inches(0.8), t_y, Inches(11.733), Inches(3.3))
    tbl = tbl_shape.table
    tbl.columns[0].width = Inches(5.8)
    tbl.columns[1].width = Inches(5.933)

    table_data = [
        ("Potential Operational Challenges & Risks", "Engineered Mitigation Strategies in KrishiConnect"),
        ("Remote Network Blackouts: Loss of 3G/4G connectivity during heavy harvest peak traffic.",
         "Offline-First Edge Queue: Mandis run local SQLite instances that buffer transactions and sync with central PostgreSQL once internet is restored."),
        ("Digital Illiteracy & Dialect Variation: Rural farmers unable to navigate complex UI menus.",
         "Multi-lingual Trilingual SMS & Voice Cues: Native Bengali, Hindi, and English SMS templates + high-contrast icon-based screens."),
        ("Harvest Glut & Traffic Surges: Mandi yards overwhelmed by sudden post-harvest grain dumping.",
         "Predictive e-NAM Traffic Balancing: Algorithm throttles booking capacity 48h in advance based on wholesale-to-MSP market spreads."),
        ("Quality Assaying Disputes: Farmer pushback against produce rejection or arbitrary deductions.",
         "Certified Digital Moisture Probe & Sun-Drying Buffer: Eliminates trader guesswork; automated 2.5h drying grace preserves booking priority.")
    ]

    for r_idx, row in enumerate(table_data):
        for c_idx, cell in enumerate(row):
            tc = tbl.cell(r_idx, c_idx)
            tc.text = cell
            p = tc.text_frame.paragraphs[0]
            if r_idx == 0:
                p.font.bold = True
                p.font.size = Pt(11)
                p.font.color.rgb = C_WHITE
                tc.fill.solid()
                tc.fill.fore_color.rgb = C_NAVY
            else:
                p.font.size = Pt(9.5)
                p.font.color.rgb = C_DARK
                tc.fill.solid()
                tc.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_BG_BOX

    # ==========================================
    # SLIDE 5: IMPACT AND BENEFITS
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "IMPACT AND QUANTIFIABLE BENEFITS", 5)
    add_footer(s5)

    # 4 Metric Highlights
    metrics = [
        ("Turnaround Time", "18h -> 45m", "From overnight highway queues to rapid intake"),
        ("Diesel & Demurrage Savings", "Rs.1,200 / Trip", "Eliminated tractor engine idling and queue delays"),
        ("Commission Leakage", "0%", "100% of statutory MSP transferred directly via DBT"),
        ("Tractor Idling Emissions", "-70%", "Substantial drop in approach road carbon output")
    ]

    for i, (m_title, m_val, m_sub) in enumerate(metrics):
        mx = Inches(0.8 + i * 2.98)
        m_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, mx, Inches(1.75), Inches(2.78), Inches(1.8))
        m_box.fill.solid()
        m_box.fill.fore_color.rgb = C_BG_BOX
        m_box.line.color.rgb = C_GREEN

        tb = s5.shapes.add_textbox(mx + Inches(0.08), Inches(1.85), Inches(2.62), Inches(1.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = m_title
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = C_NAVY

        p2 = tf.add_paragraph()
        p2.text = m_val
        p2.font.bold = True
        p2.font.size = Pt(18)
        p2.font.color.rgb = C_ORANGE
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = m_sub
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = C_MUTED
        p3.space_before = Pt(4)

    # Bottom Two Columns
    b_y = Inches(3.75)
    b_w = Inches(5.75)
    b_h = Inches(3.1)

    # Audience Impact Card
    b1 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), b_y, b_w, b_h)
    b1.fill.solid()
    b1.fill.fore_color.rgb = C_BG_BOX
    b1.line.color.rgb = C_BORDER
    tb1 = s5.shapes.add_textbox(Inches(0.95), b_y + Inches(0.15), b_w - Inches(0.3), b_h - Inches(0.3))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "Target Audience Impact"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(8)

    aud_points = [
        "140M+ Indian Farmers: Guaranteed access to MSP without commission agent exploitation; complete transparency from slot booking to bank payout.",
        "Mandi Secretaries & Procurement Officers: Complete district-level real-time visibility into yard density, weighbridge bottlenecks, and daily procurement quotas.",
        "FCI & Ministry of Consumer Affairs: Real-time public distribution inventory tracking, preventing regional food inflation and warehouse storage rotting."
    ]
    for ap in aud_points:
        p = tf1.add_paragraph()
        p.text = f"• {ap}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(6)

    # Multi-Dimensional Benefits Card
    b2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), b_y, b_w, b_h)
    b2.fill.solid()
    b2.fill.fore_color.rgb = C_BG_BOX
    b2.line.color.rgb = C_BORDER
    tb2 = s5.shapes.add_textbox(Inches(6.93), b_y + Inches(0.15), b_w - Inches(0.3), b_h - Inches(0.3))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "Multi-Dimensional Benefits"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(8)

    ben_points = [
        "Economic: Direct treasury transfers eliminate informal 4-8% commission agent deductions, ensuring full government MSP proceeds reach the farmer.",
        "Social: Eliminates physical queue-jumping, corruption, and local trader favoritism; guarantees equal priority for small and marginal landholders.",
        "Environmental & Food Security: Eliminates long tractor traffic queues and prevents grain aflatoxin mould formation through strict moisture gates."
    ]
    for bp in ben_points:
        p = tf2.add_paragraph()
        p.text = f"• {bp}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(6)

    # ==========================================
    # SLIDE 6: RESEARCH AND REFERENCES
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "RESEARCH, STANDARDS AND REFERENCES", 6)
    add_footer(s6)

    refs = [
        ("Department of Consumer Affairs (DoCA)", "Guidelines on Price Stabilization Fund (PSF), Procurement Protocols, and Price Monitoring System.", "consumeraffairs.nic.in"),
        ("Commission for Agricultural Costs & Prices (CACP)", "Statutory Minimum Support Price (MSP) Reports for Kharif and Rabi Marketing Seasons.", "cacp.dacnet.nic.in"),
        ("Directorate of Marketing & Inspection (DMI)", "Agricultural Produce Grading and Marking Act; Rule 24 Statutory Form 'J' Mandi Gazette Framework.", "dmi.gov.in"),
        ("National Agriculture Market (e-NAM Portal)", "API specifications for wholesale modal mandi price tickers and real-time inter-mandi price arbitrage.", "enam.gov.in"),
        ("Ministry of Finance & PFMS", "Direct Benefit Transfer (DBT) Mission Guidelines; e-Kuber Core Banking System disbursement protocol.", "dbtbharat.gov.in"),
        ("National Mobile Seva (C-DAC MSDG)", "Government Citizen SMS Gateway Integration & Regional Telecommunication Standards for Rural Outreach.", "mgov.gov.in")
    ]

    r_w = Inches(5.75)
    r_h = Inches(1.5)

    for i, (title, desc, link) in enumerate(refs):
        col = i % 2
        row = i // 2
        rx = Inches(0.8 + col * 5.98)
        ry = Inches(1.75 + row * 1.7)

        r_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rx, ry, r_w, r_h)
        r_card.fill.solid()
        r_card.fill.fore_color.rgb = C_BG_BOX
        r_card.line.color.rgb = C_BORDER

        tb = s6.shapes.add_textbox(rx + Inches(0.12), ry + Inches(0.1), r_w - Inches(0.24), r_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{i+1}. {title}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = C_NAVY

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9)
        p2.font.color.rgb = C_DARK
        p2.space_before = Pt(3)

        p3 = tf.add_paragraph()
        p3.text = f"Source Portal: {link}"
        p3.font.bold = True
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = C_ORANGE
        p3.space_before = Pt(2)

    output_filename = "KrishiConnect_SIH2026_Submission.pptx"
    prs.save(output_filename)
    print(f"Presentation successfully compiled: {output_filename}")

if __name__ == "__main__":
    create_sih_deck()