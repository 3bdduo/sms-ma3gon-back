import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { Settings, BlogPost, MediaItem } from "../schemas";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Settings.name) private readonly settingsModel: Model<Settings>,
    @InjectModel(BlogPost.name) private readonly blogModel: Model<BlogPost>,
    @InjectModel(MediaItem.name) private readonly mediaModel: Model<MediaItem>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedSettings();
    await this.seedBlog();
    await this.seedMedia();
  }

  private async seedSettings() {
    const existing = await this.settingsModel.findById(1);
    if (existing) return;

    const defaultPassword = this.configService.get<string>("adminDefaultPassword") || "Admin123";
    const adminPassword = await bcrypt.hash(defaultPassword, 10);

    await this.settingsModel.create({
      _id: 1,
      school_name: "مدرسة القرءان الكريم بقرية معجون",
      school_phone: "01119838926",
      school_address: "بني سويف - مركز سمسطا - قرية دشطوط - عزبة معجون",
      monthly_fee: 200,
      admin_password: adminPassword,
    });

    this.logger.log("✅ تم إنشاء الإعدادات الافتراضية (اسم دخول الأدمن: Admin)");
  }

  private async seedBlog() {
    const count = await this.blogModel.countDocuments();
    if (count > 0) return;

    const posts = [
      {
        id: "post-quranic-home-environment",
        title: "كيف تصنع في بيتك بيئة قرآنية ملهمة يعشقها أبناؤك؟ (7 خطوات عملية)",
        slug: "how-to-create-a-quranic-home-environment",
        category: "تربية",
        author: "إدارة المدرسة",
        published: true,
        published_at: new Date(),
        excerpt: "دليل تربوي عملي يضع بين يدي الوالدين خطوات يومية ملموسة لتحويل المنزل إلى روضة إيمانية تجعل الأبناء يقبلون على كتاب الله بشغف وطمأنينة دون إكراه.",
        content: `بسم الله الرحمن الرحيم، والصلاة والسلام على المبعوث رحمة للعالمين، نبينا محمد وعلى آله وصحبه أجمعين.

إن أعظم هدية يقدمها الوالدان لفلذات أكبادهم ليست مجرد تسجيلهم في حلقة تحفيظ، بل تحويل البيت نفسه إلى محضن قرآني تنبض زواياه بالنور والسكينة. فحين يرى الطفل أن القرآن هو روح المنزل ودستوره، ينشأ محباً لكتاب ربه، متذوقاً لحلاوته.

إليكم سبع خطوات عملية ومجربة لصناعة هذه البيئة المباركة:
1. القدوة الصامتة تسبق المواعظ المنطوقة: رؤية الوالدين يتلوان القرآن طواعية وشوقاً تنقش في عقل الطفل الباطن أن هذا الكتاب هو الملاذ الحقيقي والمنبع الأصفى للسعادة.
2. تخصيص "محراب النور" داخل البيت: ركن هادئ ونظيف مخصص للترتيل يمنح جلسة القرآن هيبة ومكانة خاصة في نفس الطفل.
3. جعل وقت القرآن واحة سكينة لا ساحة محاسبة: ابتعد عن الصراخ والتأنيب، واجعل وقت التسميع مقروناً بالأمان والتشجيع.
4. الاحتفاء بالجهد قبل تمام الحفظ: الثناء على المحاولة والاستمرار يبني همة عالية وثقة بالنفس.
5. إحياء الحوار والتدبر في قصص القرآن: مدارسة سير الأنبياء وربطها بالواقع العملي والتربوي.
6. بركة الاستماع الدائم في أرجاء البيت: ترتيل كبار القراء المجودين يربي الأذن القرآنية بالفطرة.
7. الدعاء الصادق بظهر الغيب: سؤال الله دائماً صلاح الذرية وثباتهم على الهدى.`,
      },
      {
        id: "post-secret-of-mastery-revision",
        title: "سر الإتقان النبوي: لماذا تُقدَّم المراجعة والربط التراكمي على الحفظ الجديد؟",
        slug: "the-secret-of-mastery-revision-over-memorization",
        category: "فوائد قرآنية",
        author: "لجنة التحفيظ والإتقان",
        published: true,
        published_at: new Date(),
        excerpt: "منهجية علمية راسخة من صدور كبار الحفّاظ لكيفية ترويض الذاكرة، وبناء الربط التراكمي للسور، وتثبيت كتاب الله في الصدر كالجبال الرواسي.",
        content: `الحمد لله الذي أنزل القرآن هدىً ونوراً، والصلاة والسلام على رسوله الذي كان خلقه القرآن.

الحقيقة المجمع عليها عند جهابذة الإقراء وحفّاظ الأمة هي: "ليس الحافظ من حفظ.. بل الحافظ من راجع واستحضر".

معالم الخطة الذهبية للإتقان والتثبيت:
1. قانون التوازن (قاعدة 1 إلى 3): اجعل ثلاثة أرباع وقتك لمراجعة القديم والماضي القريب، واقصر الربع على حيازة الجديد.
2. تقنية الربط التراكمي المتسلسل: لا تنتقل لصفحة حتى تدمجها غيباً مع الصفحات السابقة في تلاوة واحدة متصلة.
3. الاستدعاء النشط دون النظر: أغلق المصحف تماماً واستخرج الآيات بجهد الذاكرة الذاتية ليثبت الحفظ.
4. الصلاة بالمحفوظ في المحاريب: التلاوة في قيام الليل ونوافل النهار أعظم مثبت لكتاب الله في الفؤاد.
5. رفقة التحفيظ والتسميع التبادلي: رفيق الحلقة يكشف الأخطاء الخفية ويشحذ العزيمة والهمة.`,
      },
      {
        id: "post-beauty-of-tartil-tajweed",
        title: "جماليات الترتيل: كيف يحيل التجويد المتقن الحروف إلى أنوار تهز الوجدان؟",
        slug: "the-beauty-of-tartil-and-tajweed-secrets",
        category: "تجويد",
        author: "قسم الإقراء والسنَد",
        published: true,
        published_at: new Date(),
        excerpt: "رحلة ماتعة في أسرار النطق العربي القرآني، تكشف كيف يصنع التلقي المشافه والتطبيق الدقيق للمخارج والصفات سحر البيان الإلهي.",
        content: `قال الله تبارك وتعالى: ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾.

التجويد ليس مجرد قواعد نظرية، بل هو حلية التلاوة وزينة الأداء والميزان الصوتي الدقيق لكلام رب العالمين.
أسرار الترتيل المتقن:
1. المشافهة والتلقي الحي: مقادير المدود وأزمنة الغنن لا تؤخذ إلا من أفواه المشايخ المتقنين بالسند المتصل.
2. هندسة المخارج والصفات: إعطاء كل حرف حقه ومستحقه يمنح الكلمات وزناً ربانياً يأسر القلوب.
3. الوقف والابتداء: مرآة الفهم والتفسير السليم للمعاني الإلهية.
4. الترتيل الفطري العذب الخالي من التكلف والتمطيط المصطنع.`,
      },
      {
        id: "post-parents-guide-quran-school",
        title: "بوصلة الوالدين: كيف تختار المحضن القرآني الأنسب لبناء شخصية طفلك؟",
        slug: "parents-guide-to-choosing-a-trusted-quran-school",
        category: "أخبار المدرسة",
        author: "إدارة المدرسة",
        published: true,
        published_at: new Date(),
        excerpt: "معايير جوهرية تعين كل أب وأم على اختيار بيئة قرآنية أصيلة تجمع بين الضبط العلمي الرصين والدفء التربوي الذي يصون الفطرة ويزكي النفس.",
        content: `في زمن كثرت فيه المشتتات الرقمية، أضحى اختيار المحضن القرآني الموثوق أعظم قرار تربوي للوالدين.
المعايير الأربعة الأساسية:
1. أصالة السند وكفاءة الكادر التعليمي الحاصل على إجازات قرآنية معتمدة.
2. المنهج التربوي الشامل الذي يربط الآيات بالسلوك والأخلاق والآداب الإسلامية.
3. الشفافية والتقارير الدورية المستمرة التي تضع ولي الأمر في قلب رحلة الطالب.
4. البيئة التنافسية المحفزة التي تغرس حب المسجد والصحبة الصالحة.`,
      },
    ];

    await this.blogModel.insertMany(posts);
    this.logger.log("✅ تم إضافة المقالات والروابط القرآنية الموصى بها إلى المدونة");
  }

  private async seedMedia() {
    const count = await this.mediaModel.countDocuments();
    if (count > 0) return;

    const items = [
      {
        id: "media-fatiha-mastery",
        title: "مجلس تصحيح التلاوة: ضبط مخارج الحروف في سورة الفاتحة وقصار السور",
        description: "درس تطبيقي متقن يوضح دقائق مخارج الحروف والصفات في فاتحة الكتاب، مع بيان الأخطاء الشائعة وطرق تفاديها عمليًا برواية حفص عن عاصم.",
        video_url: "https://www.youtube.com/embed/k9p-pQzE368",
        thumbnail_url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80",
        track: "تفسير وتجويد",
        level: "جميع المستويات",
        teacher_name: "فضيلة الشيخ د. أيمن رشدي سويد",
        is_live: false,
        published: true,
      },
      {
        id: "media-hadr-murattal",
        title: "ختمة الحدر الميسرة للمراجعة والتثبيت السريع للحفاظ",
        description: "تلاوة حدر سريعة ومنضبطة بالأحكام التجويدية تعين الحافظ على تثبيت ورده القرآني اليومي ومراجعة الأجزاء بسلاسة دون تفلت.",
        video_url: "https://www.youtube.com/embed/videoseries?list=PLP_4qKj3l3a7PZq2oB9W7yC4l2s9sXjX7",
        thumbnail_url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80",
        track: "تحفيظ",
        level: "الحفاظ والمتقدمين",
        teacher_name: "الشيخ محمود خليل الحصري (رحمه الله)",
        is_live: false,
        published: true,
      },
      {
        id: "media-wakf-ibtida",
        title: "أسرار الوقف والابتداء وعجائب التدبر في آيات الذكر الحكيم",
        description: "شرح بديع يوضح كيف يتغير المعنى القرآني باختلاف مواضع الوقف، وكيف يعين الوقف الصحيح على استشعار مقاصد السور وجلال الآيات.",
        video_url: "https://www.youtube.com/embed/tM0sX0sWfI4",
        thumbnail_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
        track: "تفسير وتجويد",
        level: "متوسط ومتقدم",
        teacher_name: "نخبة من كبار أساتذة القراءات والتفسير",
        is_live: false,
        published: true,
      },
      {
        id: "media-madinah-live",
        title: "بث مباشر: روائع التلاوات والصلوات من المسجد النبوي الشريف بالمدينة المنورة",
        description: "نفحات إيمانية متجددة وبث مباشر على مدار الساعة لنقل الصلوات الخاشعة والأدعية المباركة من رحاب الحرم النبوي الطاهر.",
        video_url: "https://www.youtube.com/embed/moQ_hY74e6U",
        thumbnail_url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80",
        track: "تحفيظ",
        level: "بث مباشر",
        teacher_name: "أئمة الحرمين الشريفين",
        is_live: true,
        published: true,
      },
      {
        id: "media-quranic-stories-manners",
        title: "روائع القصص القرآني: كيف نبني وجدان وعقيدة الطفل المسلم؟",
        description: "سلسلة تربوية بليغة تستعرض العبر الإيمانية والأخلاقية من قصص الأنبياء لربط الطالب بالهدي القرآني في سلوكه وواقعه المعاش.",
        video_url: "https://www.youtube.com/embed/3-fU2n0_aQI",
        thumbnail_url: "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=800&q=80",
        track: "علوم شرعية",
        level: "الناشئة والبراعم",
        teacher_name: "د. راغب السرجاني وعلماء التربية الإسلامية",
        is_live: false,
        published: true,
      },
      {
        id: "media-minshawi-khushoo",
        title: "محراب الخشوع: تلاوة نموذجية مرتلة تأسر القلوب وتعين على التدبر",
        description: "صوت ملائكي فريد وأداء يفيض بالسكينة والخشوع في تلاوة القرآن الكريم برواية حفص عن عاصم، ترتقي بالروح وتهذب النفس.",
        video_url: "https://www.youtube.com/embed/videoseries?list=PL89F8F87C5E98FDB8",
        thumbnail_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        track: "تحفيظ",
        level: "جميع المستويات",
        teacher_name: "فضيلة الشيخ محمد صديق المنشاوي (رحمه الله)",
        is_live: false,
        published: true,
      },
    ];

    await this.mediaModel.insertMany(items);
    this.logger.log("✅ تم إضافة التسجيلات والروابط القرآنية الموصى بها إلى المكتبة");
  }
}
