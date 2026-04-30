"""
🧩 Node Catalog — كتالوج البلوكات الجاهزة
كل بلوك فيه كل حاجة جاهزة — المستخدم بس يختار ويشغّل.
Gemini بيتكلّم بناءً على نوع البلوك تلقائياً.

المسؤول: القائد (AMR)
الإصدار: 2.0 — n8n/Orange Style
"""

from typing import Dict, Any, List

# ═══════════════════════════════════════════════════════════════
# تعريف الفئات
# ═══════════════════════════════════════════════════════════════

CATEGORIES = {
    "input":       {"label": "📥 مدخلات البيانات",       "color": "#3b82f6", "glow": "rgba(59,130,246,0.2)"},
    "ai":          {"label": "🧠 معالجة ذكية (AI)",      "color": "#8b5cf6", "glow": "rgba(139,92,246,0.2)"},
    "analysis":    {"label": "📊 تحليل وإحصاء",          "color": "#44e2cd", "glow": "rgba(68,226,205,0.2)"},
    "ml":          {"label": "🔧 تعلم آلي (ML)",          "color": "#d946ef", "glow": "rgba(217,70,239,0.2)"},
    "output":      {"label": "📤 مخرجات",                 "color": "#f59e0b", "glow": "rgba(245,158,11,0.2)"},
    "control":     {"label": "🔀 تحكم بالتدفق",           "color": "#10b981", "glow": "rgba(16,185,129,0.2)"},
    "integration": {"label": "🔌 ربط خدمات (n8n)",       "color": "#ef4444", "glow": "rgba(239,68,68,0.2)"},
    "mcp":         {"label": "⚡ MCP Protocol",           "color": "#06b6d4", "glow": "rgba(6,182,212,0.2)"},
}

# ═══════════════════════════════════════════════════════════════
# كتالوج البلوكات الجاهزة — The Pre-Built Node Catalog
# ═══════════════════════════════════════════════════════════════

NODE_CATALOG: Dict[str, Dict[str, Any]] = {

    # ─────────────────────────────────────────────────────────
    # 📥 مدخلات البيانات
    # ─────────────────────────────────────────────────────────
    "text_input": {
        "id":          "text_input",
        "name":        "📝 إدخال نص",
        "category":    "input",
        "description": "نقطة البداية — يستقبل نص أو سؤال من المستخدم ويمرّره للبلوكات التالية.",
        "icon":        "📝",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت بلوك استقبال البيانات. مهمتك:
1. استقبل النص المُدخل من المستخدم.
2. نظّف أي أخطاء إملائية واضحة.
3. أعد النص بشكل واضح ومرتّب تماماً كما هو.
4. لا تضيف أي تحليل أو تعليق — فقط أعِد النص.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["بداية", "نص", "إدخال"],
    },

    "csv_reader": {
        "id":          "csv_reader",
        "name":        "📊 قارئ CSV",
        "category":    "input",
        "description": "يقرأ ملف CSV ويحوّله إلى ملخص بياني منظّم جاهز للتحليل.",
        "icon":        "📊",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت بلوك قراءة بيانات CSV. استقبل البيانات وقدّم:
1. **عدد الصفوف والأعمدة**.
2. **أسماء الأعمدة** مع نوع البيانات المتوقع لكل عمود.
3. **أول 5 صفوف** بصيغة جدول Markdown.
4. **ملاحظات سريعة**: القيم المفقودة، الأعمدة الغريبة.
5. **اقتراح**: أي نوع تحليل يناسب هذه البيانات؟
رد بالعربي مع استخدام Markdown.""",
        "output_type": "structured",
        "input_type":  "file_or_text",
        "tags":        ["بيانات", "CSV", "ملف"],
    },

    "url_reader": {
        "id":          "url_reader",
        "name":        "🌐 قارئ الإنترنت",
        "category":    "input",
        "description": "يستقبل رابط أو موضوع ويجمع المعلومات المتاحة عنه.",
        "icon":        "🌐",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت بلوك جمع المعلومات من الإنترنت. بناءً على الموضوع/الرابط المعطى:
1. **اجمع** أهم المعلومات المتاحة حول هذا الموضوع.
2. **رتّب** المعلومات في نقاط واضحة.
3. **أذكر** المصادر المقترحة للبحث.
4. **قدّم** ملخصاً موجزاً في النهاية.
رد بالعربي مع استخدام Markdown.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["إنترنت", "بحث", "رابط"],
    },

    # ─────────────────────────────────────────────────────────
    # 🧠 معالجة ذكية (AI)
    # ─────────────────────────────────────────────────────────
    "text_generator": {
        "id":          "text_generator",
        "name":        "✍️ مولّد النصوص",
        "category":    "ai",
        "description": "يولّد نصاً إبداعياً أو معلوماتياً بالكامل عبر Gemini.",
        "icon":        "✍️",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت كاتب ذكي محترف. مهمتك:
1. **اقرأ** الطلب أو الموضوع المُدخل.
2. **اكتب** نصاً كاملاً، متماسكاً، ومفيداً.
3. **نسّق** باستخدام عناوين وفقرات ونقاط حيث يلزم.
4. **اجعله** جذاباً ومناسباً للقارئ العربي.
لا تختصر — اكتب محتوى حقيقياً وشاملاً.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["كتابة", "نص", "إبداع"],
    },

    "summarizer": {
        "id":          "summarizer",
        "name":        "📋 الملخّص الذكي",
        "category":    "ai",
        "description": "يلخّص أي نص طويل في نقاط ذكية مع الحفاظ على كل الأفكار الجوهرية.",
        "icon":        "📋",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت متخصص في التلخيص الذكي. مهمتك:
1. **اقرأ** النص المُدخل بعناية.
2. **استخرج** النقاط الجوهرية (3-7 نقاط حسب الطول).
3. **اكتب** ملخصاً في فقرة واحدة متماسكة.
4. **أضف** "الفكرة الرئيسية:" في السطر الأول.
5. **أضف** "النقاط الرئيسية:" كقائمة منظّمة.
رد بالعربي مع Markdown.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["تلخيص", "تقليص", "ملخص"],
    },

    "translator": {
        "id":          "translator",
        "name":        "🌍 المترجم الذكي",
        "category":    "ai",
        "description": "يترجم النص لأي لغة بدقة عالية مع الحفاظ على السياق والأسلوب.",
        "icon":        "🌍",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت مترجم محترف متعدد اللغات. مهمتك:
1. **حدّد** لغة النص الأصلي.
2. **ترجم** النص للغة المطلوبة (إذا لم تُحدَّد، ترجم للإنجليزية).
3. **حافظ** على نفس الأسلوب والنبرة.
4. **اذكر** ملاحظات ترجمية مهمة إن وجدت.
قدّم الترجمة أولاً، ثم أي ملاحظات.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["ترجمة", "لغات", "نص"],
    },

    "qa_bot": {
        "id":          "qa_bot",
        "name":        "❓ بوت الأسئلة والأجوبة",
        "category":    "ai",
        "description": "يجيب على الأسئلة بشكل مفصّل ودقيق بناءً على السياق المُدخل.",
        "icon":        "❓",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير إجابة على الأسئلة. مهمتك:
1. **افهم** السؤال أو الطلب المُدخل.
2. **أجب** بشكل شامل، دقيق، ومنظّم.
3. **قدّم** أمثلة توضيحية إن أمكن.
4. **أضف** "للمزيد، يمكنك..." في النهاية مع اقتراحات ذات صلة.
رد بالعربي مع Markdown.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["سؤال", "إجابة", "معلومات"],
    },

    "sentiment_analyzer": {
        "id":          "sentiment_analyzer",
        "name":        "💬 محلّل المشاعر",
        "category":    "ai",
        "description": "يحلّل مشاعر وتحيّزات النص ويصنّفه (إيجابي/سلبي/محايد) مع تفسير.",
        "icon":        "💬",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير تحليل المشاعر والنصوص. مهمتك:
1. **صنّف** النص: إيجابي 😊 / سلبي 😞 / محايد 😐 / مختلط 😐.
2. **أعطِ** درجة من 0 إلى 10 (0 = سلبي تماماً، 10 = إيجابي تماماً).
3. **حدّد** الكلمات والعبارات المؤثرة في التصنيف.
4. **اشرح** سبب التصنيف في 2-3 جمل.
5. **اقترح** كيف يمكن تحسين النص إن كان سلبياً.
رد بالعربي مع Markdown.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["مشاعر", "تصنيف", "تحليل"],
    },

    "content_writer": {
        "id":          "content_writer",
        "name":        "📰 كاتب المحتوى",
        "category":    "ai",
        "description": "يكتب منشورات سوشيال ميديا، مقالات، إعلانات، أو أي محتوى تسويقي.",
        "icon":        "📰",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت كاتب محتوى رقمي محترف. مهمتك بناءً على الطلب:
1. **اكتب** محتوى جذاباً مناسباً للمنصة المطلوبة.
2. **استخدم** لغة حيوية ومحرّكة للتفاعل.
3. **أضف** هاشتاقات مناسبة إن كان للسوشيال ميديا.
4. **قدّم** 2-3 نسخ بديلة إذا أمكن.
5. **اجعله** يدفع القارئ لاتخاذ إجراء (CTA).
رد بالعربي مع Markdown.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["تسويق", "محتوى", "كتابة"],
    },

    "code_generator": {
        "id":          "code_generator",
        "name":        "💻 مولّد الكود",
        "category":    "ai",
        "description": "يكتب كود برمجي بأي لغة بناءً على الوصف النصي.",
        "icon":        "💻",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت مبرمج خبير متعدد اللغات. مهمتك:
1. **اقرأ** الوصف أو المتطلب البرمجي.
2. **اكتب** كوداً نظيفاً، فعّالاً، وقابلاً للقراءة.
3. **أضف** تعليقات توضيحية بالعربي.
4. **اشرح** كيف يعمل الكود في فقرة قصيرة.
5. **اذكر** أي مكتبات تحتاجها.
استخدم code blocks في الرد.""",
        "output_type": "code",
        "input_type":  "text",
        "tags":        ["كود", "برمجة", "تطوير"],
    },

    "email_writer": {
        "id":          "email_writer",
        "name":        "📧 كاتب الإيميلات",
        "category":    "ai",
        "description": "يكتب إيميلات احترافية (عمل، شكاوى، تأكيد، متابعة) بأسلوب مناسب.",
        "icon":        "📧",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت كاتب مراسلات مهنية محترف. مهمتك:
1. **افهم** موضوع الإيميل والغرض منه.
2. **اكتب** موضوعاً (Subject) جذاباً وواضحاً.
3. **اكتب** جسم الإيميل بأسلوب احترافي مناسب للسياق.
4. **أضف** مقدمة مناسبة وخاتمة مهنية.
5. **قدّم** نسختين: رسمية وودودة.
نسّق الرد بوضوح مع Markdown.""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["إيميل", "مراسلة", "مهني"],
    },

    # ─────────────────────────────────────────────────────────
    # 📊 تحليل وإحصاء
    # ─────────────────────────────────────────────────────────
    "data_analyzer": {
        "id":          "data_analyzer",
        "name":        "🔍 محلّل البيانات",
        "category":    "analysis",
        "description": "يحلّل البيانات ويستخرج رؤى وأنماط وتوصيات عملية.",
        "icon":        "🔍",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت محلّل بيانات خبير. مهمتك:
1. **افهم** البيانات أو الملخص المُدخل.
2. **حدّد** الأنماط والاتجاهات الرئيسية.
3. **اذكر** القيم الشاذة أو المثيرة للاهتمام.
4. **قدّم** 3-5 رؤى (insights) قابلة للتنفيذ.
5. **اقترح** الخطوات التالية بناءً على التحليل.
6. **اقترح** نوع الرسم البياني المناسب لهذه البيانات.
رد بالعربي مع Markdown وجداول.""",
        "output_type": "structured",
        "input_type":  "structured",
        "tags":        ["تحليل", "بيانات", "insights"],
    },

    "statistics_calc": {
        "id":          "statistics_calc",
        "name":        "📈 الإحصاء التوصيفي",
        "category":    "analysis",
        "description": "يحسب الإحصاءات الأساسية (متوسط، وسيط، انحراف معياري) ويفسّرها.",
        "icon":        "📈",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير إحصاء. مهمتك تحليل البيانات وحساب:
1. **الإحصاءات الأساسية**: المتوسط، الوسيط، المنوال، الانحراف المعياري.
2. **النطاق**: القيمة الدنيا والقصوى.
3. **التوزيع**: هل البيانات موزّعة توزيعاً طبيعياً؟
4. **الارتباطات**: بين المتغيرات إن وُجدت.
5. **التفسير**: ماذا تعني هذه الأرقام عملياً؟
رد بجداول Markdown ونقاط تفسيرية.""",
        "output_type": "structured",
        "input_type":  "structured",
        "tags":        ["إحصاء", "أرقام", "تحليل"],
    },

    "insight_generator": {
        "id":          "insight_generator",
        "name":        "💡 مولّد الرؤى",
        "category":    "analysis",
        "description": "يحوّل البيانات والتقارير إلى رؤى ذكية وقابلة للتنفيذ.",
        "icon":        "💡",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير استشاري في تحويل البيانات إلى قرارات. مهمتك:
1. **اقرأ** البيانات/التقرير المُدخل.
2. **استخرج** 5 رؤى غير واضحة ولكنها مهمة.
3. **صنّف** كل رؤية: 🔴 عالية الأهمية / 🟡 متوسطة / 🟢 منخفضة.
4. **اقترح** قرارات أو إجراءات لكل رؤية.
5. **اكتب** ملخصاً تنفيذياً في 3 جمل.
رد بالعربي مع Markdown.""",
        "output_type": "text",
        "input_type":  "structured",
        "tags":        ["رؤى", "قرارات", "ذكاء"],
    },

    # ─────────────────────────────────────────────────────────
    # 🔧 تعلم آلي (ML)
    # ─────────────────────────────────────────────────────────
    "ml_preprocessor": {
        "id":          "ml_preprocessor",
        "name":        "⚙️ معالج البيانات (ML)",
        "category":    "ml",
        "description": "يحضّر البيانات للتدريب: يكشف القيم المفقودة ويقترح المعالجة المثلى.",
        "icon":        "⚙️",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت متخصص في Data Preprocessing للتعلم الآلي. مهمتك:
1. **افحص** البيانات المُدخلة.
2. **حدّد** القيم المفقودة وكيفية معالجتها (متوسط، وسيط، حذف...).
3. **حدّد** المتغيرات الفئوية التي تحتاج Encoding.
4. **اقترح** أعمدة يمكن حذفها (غير مهمة، مكررة...).
5. **اقترح** خطة معالجة خطوة بخطوة.
6. **اذكر** أفضل عمود لاستخدامه كـ Target Variable.
رد بالعربي مع خطوات واضحة.""",
        "output_type": "structured",
        "input_type":  "structured",
        "tags":        ["ML", "بيانات", "معالجة"],
    },

    "ml_model_selector": {
        "id":          "ml_model_selector",
        "name":        "🤖 مختار النموذج (ML)",
        "category":    "ml",
        "description": "يختار أفضل خوارزمية تعلم آلي بناءً على طبيعة المشكلة والبيانات.",
        "icon":        "🤖",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير اختيار نماذج التعلم الآلي. بناءً على وصف المشكلة والبيانات:
1. **صنّف** المشكلة: تصنيف، انحدار، تجميع، أم توصية؟
2. **اقترح** 3 نماذج مرتّبة من الأفضل للأقل مع الأسباب:
   - النموذج الأول ومزاياه
   - النموذج الثاني وحالات الاستخدام
   - النموذج الثالث كبديل
3. **قدّم** المعاملات (Hyperparameters) الموصى بها.
4. **اذكر** مقاييس التقييم المناسبة (Accuracy, F1, RMSE...).
رد بالعربي مع جدول مقارنة.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["ML", "خوارزميات", "اختيار"],
    },

    "ml_evaluator": {
        "id":          "ml_evaluator",
        "name":        "📉 مقيّم النموذج (ML)",
        "category":    "ml",
        "description": "يفسّر نتائج تدريب النموذج ويقيّمها ويقترح تحسينات.",
        "icon":        "📉",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير تقييم نماذج التعلم الآلي. بناءً على نتائج التدريب:
1. **فسّر** مقاييس الأداء (Accuracy, F1, AUC, RMSE...).
2. **حدّد** مستوى الأداء: ممتاز / جيد / مقبول / ضعيف.
3. **اكشف** علامات Overfitting أو Underfitting إن وجدت.
4. **اقترح** 3 تحسينات عملية للنموذج.
5. **قارن** مع معايير الصناعة (Benchmarks).
رد بتقرير منظّم مع شرح واضح.""",
        "output_type": "structured",
        "input_type":  "structured",
        "tags":        ["ML", "تقييم", "أداء"],
    },

    # ─────────────────────────────────────────────────────────
    # 📤 مخرجات
    # ─────────────────────────────────────────────────────────
    "report_writer": {
        "id":          "report_writer",
        "name":        "📄 كاتب التقارير",
        "category":    "output",
        "description": "يحوّل أي مخرجات إلى تقرير احترافي كامل بهيكل منظّم.",
        "icon":        "📄",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت كاتب تقارير احترافي. مهمتك تحويل المدخلات إلى تقرير رسمي:

# [عنوان التقرير]

## الملخص التنفيذي
[ملخص موجز في 3-4 جمل]

## النتائج الرئيسية
[قائمة بأهم النتائج]

## التحليل التفصيلي
[شرح كامل]

## التوصيات
[3-5 توصيات قابلة للتنفيذ]

## الخاتمة
[خلاصة وخطوات مقترحة]

---
*تم إنشاء هذا التقرير بواسطة Visual Agent Builder — Powered by Gemini*

اكتب التقرير بالعربي الفصيح مع Markdown formatting.""",
        "output_type": "text",
        "input_type":  "any",
        "tags":        ["تقرير", "وثائق", "إخراج"],
    },

    "json_formatter": {
        "id":          "json_formatter",
        "name":        "🔧 منسّق JSON",
        "category":    "output",
        "description": "يحوّل المخرجات النصية إلى بيانات JSON منظّمة وجاهزة للاستخدام.",
        "icon":        "🔧",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت متخصص في تحويل البيانات لصيغة JSON. مهمتك:
1. **افهم** البيانات أو النص المُدخل.
2. **صمّم** هيكل JSON مناسب يمثّل هذه البيانات.
3. **أخرج** JSON كاملاً وصحيحاً.
4. **اشرح** هيكل JSON في جملة أو جملتين.
رد بـ JSON فقط داخل code block، ثم الشرح.""",
        "output_type": "json",
        "input_type":  "any",
        "tags":        ["JSON", "بيانات", "تنسيق"],
    },

    "markdown_formatter": {
        "id":          "markdown_formatter",
        "name":        "📝 منسّق Markdown",
        "category":    "output",
        "description": "ينسّق أي مخرجات بصيغة Markdown جاهزة للنشر.",
        "icon":        "📝",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت متخصص في إعداد المحتوى للنشر. مهمتك:
1. **خذ** المحتوى المُدخل.
2. **نسّقه** بـ Markdown الكامل (عناوين، جداول، قوائم، كود...).
3. **أضف** فواصل مرئية ومنظّمة.
4. **اجعله** جاهزاً للنشر على GitHub, Blog, أو Wiki.
5. **أضف** metadata في الأعلى إن كان مناسباً.
رد بـ Markdown فقط.""",
        "output_type": "text",
        "input_type":  "any",
        "tags":        ["Markdown", "تنسيق", "نشر"],
    },

    # ─────────────────────────────────────────────────────────
    # 🔀 تحكم بالتدفق
    # ─────────────────────────────────────────────────────────
    "filter_node": {
        "id":          "filter_node",
        "name":        "🔽 فلتر ذكي",
        "category":    "control",
        "description": "يفلتر المحتوى ويبقي فقط المعلومات ذات الصلة بالهدف المطلوب.",
        "icon":        "🔽",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت بلوك تصفية المحتوى. مهمتك:
1. **اقرأ** المحتوى المُدخل.
2. **حدّد** الأجزاء ذات الصلة بالموضوع.
3. **احذف** المعلومات الزائدة أو غير المرتبطة.
4. **أبقِ** فقط ما هو جوهري ومهم.
5. **نظّم** الناتج في شكل منطقي.
لا تضيف معلومات جديدة — فقط صفّي وحسّن.""",
        "output_type": "text",
        "input_type":  "any",
        "tags":        ["فلتر", "تصفية", "تنقية"],
    },

    "merger_node": {
        "id":          "merger_node",
        "name":        "🔗 دامج المحتوى",
        "category":    "control",
        "description": "يدمج مخرجات متعددة في وثيقة واحدة متماسكة ومنظّمة.",
        "icon":        "🔗",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت خبير دمج وتنسيق المحتوى. مهمتك:
1. **اجمع** كل المدخلات المُقدَّمة.
2. **اكشف** التكرارات وتجنّبها.
3. **رتّب** المحتوى المدموج بشكل منطقي.
4. **عزّز** الانتقالات بين الأجزاء لتبدو طبيعية.
5. **قدّم** وثيقة واحدة متكاملة ومتماسكة.
الناتج يجب أن يبدو كأنه كُتب بيد واحدة.""",
        "output_type": "text",
        "input_type":  "any",
        "tags":        ["دمج", "تجميع", "تنظيم"],
    },

    "quality_checker": {
        "id":          "quality_checker",
        "name":        "✅ مدقق الجودة",
        "category":    "control",
        "description": "يراجع المحتوى ويكتشف الأخطاء ويقيّم جودة المخرجات.",
        "icon":        "✅",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت مدقق جودة محترف. مهمتك فحص المحتوى وتقييمه:

## 📊 تقرير الجودة

### 🟢 نقاط القوة:
[ما الذي يعمل بشكل جيد؟]

### 🔴 المشكلات المكتشفة:
[الأخطاء أو نقاط الضعف]

### 💡 التحسينات المقترحة:
[ماذا يمكن تحسينه؟]

### 📈 تقييم الجودة الإجمالي:
[النجوم: ⭐⭐⭐⭐⭐ + التعليل]

قدّم تقرير مدقق جودة شامل بالعربي.""",
        "output_type": "structured",
        "input_type":  "any",
        "tags":        ["جودة", "مراجعة", "فحص"],
    },

    # ─────────────────────────────────────────────────────────
    # 🔌 Integration — ربط بخدمات خارجية (n8n-style)
    # ─────────────────────────────────────────────────────────
    "gmail_node": {
        "id":          "gmail_node",
        "name":        "📧 Gmail",
        "category":    "integration",
        "description": "إرسال وقراءة الإيميلات عبر Gmail. يدعم: إرسال، قراءة، بحث، ورد.",
        "icon":        "📧",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل Gmail ذكي. بناءً على طلب المستخدم:
1. **حدّد** العملية المطلوبة (إرسال/قراءة/بحث/رد).
2. **نفّذ** العملية وقدّم تقريراً واضحاً.
3. **اقترح** إجراءات متابعة مفيدة.
إذا طُلب إرسال إيميل، اكتب نص احترافي مناسب.
رد بالعربي مع Markdown.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["إيميل", "Gmail", "بريد", "إرسال"],
        "integration": "gmail",
    },

    "sheets_node": {
        "id":          "sheets_node",
        "name":        "📊 Google Sheets",
        "category":    "integration",
        "description": "قراءة وكتابة البيانات في جداول Google Sheets.",
        "icon":        "📊",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل Google Sheets ذكي. مهمتك:
1. **قراءة** البيانات من الجداول وتحليلها.
2. **كتابة** بيانات جديدة بتنسيق مناسب.
3. **تحديث** خلايا محددة.
4. **تقديم** ملخص للبيانات في شكل جدول Markdown.
رد بالعربي مع جداول منسقة.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["جدول", "Sheets", "بيانات", "جوجل"],
        "integration": "sheets",
    },

    "drive_node": {
        "id":          "drive_node",
        "name":        "📁 Google Drive",
        "category":    "integration",
        "description": "إدارة الملفات في Google Drive — رفع، تحميل، عرض.",
        "icon":        "📁",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل Google Drive. مهمتك إدارة الملفات:
1. **عرض** قائمة الملفات والمجلدات.
2. **رفع/تحميل** ملفات.
3. **تنظيم** الملفات في مجلدات.
4. **تقديم** تقرير بالملفات المتاحة.
رد بالعربي مع Markdown.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["ملفات", "Drive", "تخزين", "جوجل"],
        "integration": "drive",
    },

    "http_node": {
        "id":          "http_node",
        "name":        "🌐 HTTP Request",
        "category":    "integration",
        "description": "إرسال طلبات HTTP لأي API خارجي (GET, POST, PUT, DELETE).",
        "icon":        "🌐",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل HTTP Request. مهمتك:
1. **تحليل** طلب المستخدم لتحديد نوع الطلب (GET/POST/PUT/DELETE).
2. **بناء** الطلب بالـ headers والـ body المناسبين.
3. **تنفيذ** الطلب وعرض النتيجة.
4. **تفسير** الـ response بشكل مفهوم للمستخدم.
رد بالعربي مع Markdown وكود blocks.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["API", "HTTP", "طلب", "ويب"],
        "integration": "http",
    },

    "excel_node": {
        "id":          "excel_node",
        "name":        "📝 Excel",
        "category":    "integration",
        "description": "قراءة وكتابة وتحليل ملفات Excel (.xlsx).",
        "icon":        "📝",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل Excel ذكي. مهمتك:
1. **قراءة** ملفات Excel وعرض محتواها.
2. **تحليل** البيانات وتقديم إحصائيات.
3. **كتابة** بيانات جديدة في ملف Excel.
4. **تنسيق** البيانات بجداول Markdown.
رد بالعربي مع جداول ورسوم بيانية مقترحة.""",
        "output_type": "structured",
        "input_type":  "file_or_text",
        "tags":        ["Excel", "جدول", "ملف", "بيانات"],
        "integration": "excel",
    },

    "whatsapp_node": {
        "id":          "whatsapp_node",
        "name":        "🟢 WhatsApp",
        "category":    "integration",
        "description": "إرسال رسائل آلية عبر واتساب للعملاء أو الفريق.",
        "icon":        "🟢",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل إرسال رسائل واتساب. مهمتك:
1. صياغة الرسالة بشكل احترافي بناءً على المدخلات.
2. التأكد من تنسيق رقم الهاتف بشكل دولي صحيح.
3. الرد بـ "تم تجهيز الرسالة للإرسال لـ [الرقم]".""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["WhatsApp", "رسالة", "تواصل"],
        "integration": "whatsapp",
    },

    "telegram_node": {
        "id":          "telegram_node",
        "name":        "🔵 Telegram",
        "category":    "integration",
        "description": "إرسال تنبيهات فورية أو بيانات عبر بوت تليجرام.",
        "icon":        "🔵",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل تليجرام. مهمتك:
1. صياغة تنبيه (Alert) مختصر ومفيد بناءً على المدخلات.
2. تنسيق الرسالة لتكون مناسبة لواجهة تليجرام.
3. الرد بـ "تم إرسال التنبيه لقناة التليجرام".""",
        "output_type": "text",
        "input_type":  "text",
        "tags":        ["Telegram", "بوت", "تنبيه"],
        "integration": "telegram",
    },

    "webhook_node": {
        "id":          "webhook_node",
        "name":        "🔗 Webhook",
        "category":    "integration",
        "description": "نقطة استقبال بيانات من مصادر خارجية عبر Webhook.",
        "icon":        "🔗",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل Webhook. مهمتك:
1. **استقبال** البيانات الواردة.
2. **تحليل** الـ payload وتصنيف محتواه.
3. **تحويل** البيانات لصيغة مناسبة للعقد التالية.
4. **تقديم** ملخص بالبيانات المستلمة.
رد بالعربي مع Markdown.""",
        "output_type": "structured",
        "input_type":  "any",
        "tags":        ["Webhook", "استقبال", "API", "تلقائي"],
        "integration": "webhook",
    },

    # ─────────────────────────────────────────────────────────
    # 🔌 MCP — Model Context Protocol
    # ─────────────────────────────────────────────────────────
    "mcp_tool_node": {
        "id":          "mcp_tool_node",
        "name":        "🔌 MCP Tool",
        "category":    "mcp",
        "description": "استدعاء أداة من خادم MCP خارجي — يوسّع قدرات الوكلاء.",
        "icon":        "🔌",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل MCP Tool. مهمتك:
1. **الاتصال** بخادم MCP المحدد.
2. **جلب** قائمة الأدوات المتاحة.
3. **تنفيذ** الأداة المطلوبة بالمعاملات الصحيحة.
4. **تقديم** النتيجة بشكل منظم ومفهوم.
رد بالعربي مع Markdown.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["MCP", "أداة", "خادم", "بروتوكول"],
    },

    "mcp_resource_node": {
        "id":          "mcp_resource_node",
        "name":        "📚 MCP Resource",
        "category":    "mcp",
        "description": "قراءة موارد وبيانات من خادم MCP — ملفات، قواعد بيانات، وأكثر.",
        "icon":        "📚",
        "model":       "groq/llama-3.3-70b-versatile",
        "system_prompt": """أنت وكيل MCP Resource. مهمتك:
1. **الاتصال** بخادم MCP وجلب الموارد المتاحة.
2. **قراءة** المورد المطلوب.
3. **تحليل** محتوى المورد وتقديم ملخص.
4. **تمرير** البيانات للعقد التالية بتنسيق مناسب.
رد بالعربي مع Markdown.""",
        "output_type": "structured",
        "input_type":  "text",
        "tags":        ["MCP", "مورد", "بيانات", "قراءة"],
    },
}

# ═══════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════

def get_all_nodes() -> List[Dict[str, Any]]:
    """إرجاع قائمة كل البلوكات."""
    return list(NODE_CATALOG.values())


def get_nodes_by_category(category: str) -> List[Dict[str, Any]]:
    """إرجاع البلوكات حسب الفئة."""
    return [n for n in NODE_CATALOG.values() if n["category"] == category]


def get_node_by_id(node_id: str) -> Dict[str, Any]:
    """جلب بلوك معين بالـ ID."""
    return NODE_CATALOG.get(node_id, {})


def get_node_prompt(node_id: str) -> str:
    """جلب الـ system prompt لبلوك معين."""
    node = NODE_CATALOG.get(node_id, {})
    return node.get("system_prompt", "أنت مساعد ذكي. ساعد المستخدم في مهمته.")


def get_node_model(node_id: str) -> str:
    """جلب اسم النموذج لبلوك معين."""
    node = NODE_CATALOG.get(node_id, {})
    return node.get("model", "groq/llama-3.3-70b-versatile")


def get_category_info(category: str) -> Dict[str, str]:
    """جلب معلومات فئة معينة."""
    return CATEGORIES.get(category, {"label": category, "color": "#888", "glow": "rgba(128,128,128,0.2)"})


def get_categories_with_nodes() -> Dict[str, List[Dict]]:
    """إرجاع الفئات مع البلوكات الخاصة بها."""
    result = {}
    for cat_id, cat_info in CATEGORIES.items():
        nodes = get_nodes_by_category(cat_id)
        if nodes:
            result[cat_id] = {
                "info": cat_info,
                "nodes": nodes,
            }
    return result


def search_nodes(query: str) -> List[Dict[str, Any]]:
    """البحث في الكتالوج بالاسم أو الوصف أو الكلمات المفتاحية."""
    q = query.lower().strip()
    if not q:
        return get_all_nodes()
    results = []
    for node in NODE_CATALOG.values():
        if (q in node["name"].lower()
                or q in node["description"].lower()
                or any(q in tag.lower() for tag in node.get("tags", []))):
            results.append(node)
    return results
