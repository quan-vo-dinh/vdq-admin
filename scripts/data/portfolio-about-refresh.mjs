// Owner-supplied copy. Only Markdown emphasis/list markers and accidental pasted whitespace are normalized.
export const aboutRefresh = {
  en: `I started in frontend development and gradually expanded into **full-stack engineering**, building a strong foundation in TypeScript, React, Next.js, and NestJS. My interests extend beyond application development to *system architecture, scalability, and how distributed services interact*.

Currently, I work as a Full-stack Engineer at i-Soft, developing solutions for **Smart Factory and Industrial Digitalization** using React.js and ASP.NET Core/.NET 8. My work involves Microfrontend architecture with Nx Monorepo and Module Federation, microservices-based systems, and real-time industrial data integration.

I'm particularly interested in **software architecture, distributed systems, and system design**, exploring microservices, event-driven architecture, and communication patterns. I focus on understanding *architectural trade-offs* and applying practical engineering principles to build scalable, maintainable systems.`,
  vi: `Khởi điểm từ Frontend, tui dần lấn sân sang Backend và phát triển theo hướng **Full-stack Engineer**, với nền tảng chủ yếu trong hệ sinh thái JavaScript/TypeScript, đặc biệt là React, Next.js và NestJS. Từ chuyện làm cho giao diện chạy đúng, tui bắt đầu tò mò về cả hệ thống phía sau: các dịch vụ phối hợp ra sao, dữ liệu đi đâu, và khi bài toán lớn lên thì kiến trúc cần thay đổi thế nào.

Tui thích đào sâu công nghệ mới, khám phá kiến trúc phần mềm và cách giải quyết những bài toán trong hệ thống phân tán: từ Microservices, Event-driven Architecture đến các mẫu thiết kế như Saga. Không chỉ muốn biết công nghệ hoạt động thế nào, tui còn muốn hiểu **tại sao người ta chọn nó, đánh đổi những gì và khi nào thì nên (hoặc không nên) dùng nó**.

*Rồi môi trường tư bản gọi tên.* Tui bước ra khỏi vùng an toàn, tạm rời “tiếng mẹ đẻ” JavaScript/TypeScript để làm quen với C#/ASP.NET Core trong vai trò Full-stack Engineer (.NET/React). Lần này, sân chơi là **Smart Factory và Industrial Digitalization**, nơi tui có cơ hội tham gia xây dựng các hệ thống phục vụ vận hành nhà máy, tiếp cận kiến trúc Microfrontend với Nx Monorepo và Module Federation, cùng những bài toán Microservices và dữ liệu thời gian thực. Thêm một hệ sinh thái để khám phá, thêm một góc nhìn về kiến trúc phần mềm, và thêm những bài toán thực tế để học cách thiết kế hệ thống cho ra ngô ra khoai.`,
};
export const isoftRefresh = {
  en: `- Develop and maintain full-stack applications for **Smart Factory and Industrial Digitalization** using React.js and ASP.NET Core/.NET 8.

- Build and maintain a **scalable Microfrontend architecture** with Nx Monorepo and Module Federation, enabling *modular development and independent deployment*.

- Develop backend services and business workflows using Entity Framework Core, PostgreSQL/MySQL, Redis, and RESTful APIs.

- Integrate **microservices and real-time data** via Socket.IO for equipment monitoring, production visualization, and manufacturing operations.`,
  vi: `- Phát triển và bảo trì các ứng dụng Full-stack trong lĩnh vực **Smart Factory và Chuyển đổi số công nghiệp**, sử dụng React.js và ASP.NET Core/.NET 8 & 10.

- Xây dựng và duy trì **kiến trúc Microfrontend có khả năng mở rộng** với Nx Monorepo và Module Federation, hỗ trợ *phát triển theo mô-đun và triển khai độc lập*.

- Phát triển các dịch vụ Backend và luồng nghiệp vụ bằng Entity Framework Core, PostgreSQL/MySQL, Redis và RESTful APIs.

- Tích hợp **Microservices và dữ liệu thời gian thực** thông qua Socket.IO, phục vụ giám sát thiết bị, trực quan hóa dữ liệu sản xuất và vận hành nhà máy.`,
};
const concepts = [
  {key:'smart-factory',quote:{vi:'Smart Factory và Industrial Digitalization',en:'Smart Factory and Industrial Digitalization'},title:{vi:'Smart Factory · Phần mềm cho vận hành nhà máy',en:'Smart Factory · Software for factory operations'},body:{vi:'Kết nối dữ liệu, ứng dụng và quy trình để theo dõi, trực quan hóa và hỗ trợ vận hành sản xuất. Trong phần công việc này, trọng tâm là phát triển giải pháp phần mềm và tích hợp dữ liệu công nghiệp theo thời gian thực.',en:'Connecting data, applications and workflows to monitor, visualize and support manufacturing operations. The work described here focuses on software solutions and real-time industrial data integration.'},href:'',appearance:'highlight'},
  {key:'microfrontend',quote:{vi:'Microfrontend',en:'Microfrontend'},title:{vi:'Microfrontend · Chia giao diện thành các ứng dụng nhỏ',en:'Microfrontend · Composing smaller frontend applications'},body:{vi:'Tách một giao diện lớn thành các ứng dụng hoặc mô-đun có trách nhiệm rõ ràng, rồi ghép lại thành trải nghiệm thống nhất. Cần thiết kế cách chia sẻ thư viện, điều hướng và giao tiếp để các phần có thể phát triển, triển khai độc lập.',en:'Splitting a large interface into applications or modules with clear responsibilities, then composing a unified experience. Shared dependencies, navigation and communication need deliberate design to support independent development and deployment.'},href:'https://nx.dev/docs/technologies/module-federation/introduction'},
  {key:'nx',quote:{vi:'Nx Monorepo',en:'Nx Monorepo'},title:{vi:'Nx Monorepo · Nhiều ứng dụng, một workspace',en:'Nx Monorepo · Multiple applications, one workspace'},body:{vi:'Nx hỗ trợ tổ chức nhiều ứng dụng và thư viện dùng chung trong một repository, quản lý quan hệ phụ thuộc và các tác vụ build/test. Monorepo là cách tổ chức mã nguồn; nó vẫn có thể chứa những ứng dụng được triển khai độc lập.',en:'Nx helps organize applications and shared libraries in one repository, track dependencies and coordinate build/test tasks. A monorepo is a source-code organization choice and can still contain independently deployed applications.'},href:'https://nx.dev/docs/getting-started/intro'},
  {key:'federation',quote:{vi:'Module Federation',en:'Module Federation'},title:{vi:'Module Federation · Ghép ứng dụng tại runtime',en:'Module Federation · Composing applications at runtime'},body:{vi:'Cho phép các ứng dụng JavaScript chia sẻ và nạp mô-đun từ nhau, thường theo mô hình host/remote. Đây là một cơ chế để xây Microfrontend; chia sẻ dependency và tương thích giữa các phiên bản vẫn cần được kiểm soát.',en:'Enables JavaScript applications to expose and load modules from one another, commonly through host/remote composition. It is a mechanism for building microfrontends; dependency sharing and version compatibility still require care.'},href:'https://module-federation.io/guide/start/'},
  {key:'event-driven',quote:{vi:'Event-driven Architecture',en:'event-driven architecture'},title:{vi:'Event-driven Architecture · Phối hợp qua sự kiện',en:'Event-driven architecture · Coordinating through events'},body:{vi:'Thành phần phát sự kiện khi có thay đổi; các thành phần quan tâm nhận và xử lý sự kiện đó. Cách tiếp cận này giúp giảm phụ thuộc trực tiếp, đồng thời đặt ra bài toán về thứ tự, xử lý lặp và tính nhất quán của dữ liệu.',en:'Producers emit events when something changes, and interested consumers react to them. This reduces direct coupling while introducing trade-offs around ordering, duplicate processing and data consistency.'},href:'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven'},
  {key:'trade-offs',quote:{vi:'đánh đổi những gì',en:'architectural trade-offs'},title:{vi:'Đánh đổi kiến trúc · Chọn theo bài toán',en:'Architectural trade-offs · Choosing for the problem'},body:{vi:'Một lựa chọn kiến trúc có thể làm tốt khả năng mở rộng nhưng tăng độ phức tạp vận hành, hoặc giúp triển khai độc lập nhưng khó giữ dữ liệu nhất quán hơn. Điều tui muốn rèn là hiểu cả lợi ích lẫn chi phí trước khi chọn giải pháp.',en:'An architectural choice can improve scalability while increasing operational complexity, or enable independent releases while making data consistency harder. The goal is to understand the benefits and costs before choosing an approach.'},href:''},
];
export function refreshAboutDocument(document) {
  const next=structuredClone(document),report=[];
  for(const locale of ['vi','en']){
    const resume=next.locales[locale];resume.summary=aboutRefresh[locale];
    const work=resume.work.find(w=>w.id==='work-0'&&w.company==='i-Soft');
    if(!work)throw Error('Expected stable i-Soft entry');work.description=isoftRefresh[locale];
    const notes=resume.annotations??[];
    resume.annotations=notes.filter(n=>!['editorial-v1-node',...(locale==='en'?['editorial-v1-saga']:[])].includes(n.id));
    function revise(id,changes){const note=resume.annotations.find(n=>n.id===id);if(!note)throw Error('Expected existing note '+id);Object.assign(note,changes);}
    revise('editorial-v1-frameworks',{quote:locale==='vi'?'Next.js và NestJS':'Next.js, and NestJS'});
    revise('editorial-v1-microservices',{quote:locale==='vi'?'Microservices':'microservices',occurrence:locale==='vi'?1:2});
    revise('editorial-v1-dotnet',{quote:locale==='vi'?'C#/ASP.NET Core':'ASP.NET Core/.NET 8'});
    for(const concept of concepts){
      const id='editorial-v2-'+concept.key;
      const note={id,field:'summary',itemId:'',quote:concept.quote[locale],occurrence:1,title:concept.title[locale],body:concept.body[locale],href:concept.href,image:'',appearance:concept.appearance??'underline',enabled:true};
      const existing=resume.annotations.find(n=>n.id===id);
      if(existing)Object.assign(existing,note,{image:existing.image});else resume.annotations.push(note);
    }
    // Keep the work summary readable: explain its domain and key integration mechanism,
    // while Nx and the architecture overview remain available in About.
    for(const key of ['smart-factory','microfrontend','federation']){
      const concept=concepts.find(c=>c.key===key);
      const id='editorial-v2-work-'+key;
      const note={id,field:'work.description',itemId:work.id,quote:locale==='vi'&&key==='smart-factory'?'Smart Factory và Chuyển đổi số công nghiệp':concept.quote[locale],occurrence:1,title:concept.title[locale],body:concept.body[locale],href:concept.href,image:'',appearance:'underline',enabled:true};
      const existing=resume.annotations.find(n=>n.id===id);if(existing)Object.assign(existing,note,{image:existing.image});else resume.annotations.push(note);
    }
    report.push({locale,annotations:resume.annotations.length,summaryParagraphs:resume.summary.split('\n\n').length,workBullets:work.description.split('\n\n').length});
  }
  return {document:next,report};
}
