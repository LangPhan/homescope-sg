import { z } from "zod";

export const allowedCategories = [
  "property_search",
  "listing_comparison",
  "market_explanation",
  "product_help",
] as const;

export const classificationSchema = z.object({
  category: z.enum([
    ...allowedCategories,
    "off_topic",
    "prompt_injection",
    "unsafe",
  ]),
  language: z.enum(["vi", "en"]),
}).strict();

export type Classification = z.infer<typeof classificationSchema>;

const injectionPatterns = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?)/i,
  /bỏ\s+qua\s+(mọi\s+|tất\s+cả\s+)?(chỉ\s+dẫn|hướng\s+dẫn|quy\s+tắc|prompt)/iu,
  /(reveal|show|print|repeat|leak|disclose).{0,40}(system|developer)\s+(prompt|message|instruction)/i,
  /(tiết\s*lộ|hiển\s*thị|in\s*ra).{0,40}(system|developer|hệ\s*thống).{0,20}(prompt|chỉ\s*dẫn|bí\s*mật)/iu,
  /(api[_ -]?key|bearer\s+token|access[_ -]?token|secret|environment\s+variables?)/i,
  /^\s*(system|developer|assistant)\s*:/im,
  /<\/?(system|developer|assistant)>/i,
  /you\s+are\s+now\s+(in|a|an)\b/i,
  /hãy\s+đóng\s+vai\s+(system|developer|quản\s+trị)/iu,
];

export function looksLikePromptInjection(message: string): boolean {
  return injectionPatterns.some((pattern) => pattern.test(message));
}

export function isAllowedCategory(category: Classification["category"]): boolean {
  return (allowedCategories as readonly string[]).includes(category);
}

export function refusalFor(classification: Classification): string {
  if (classification.language === "vi") {
    if (classification.category === "prompt_injection") {
      return "Mình không thể làm theo yêu cầu thay đổi quy tắc, tiết lộ prompt hoặc bí mật hệ thống. Mình có thể giúp bạn tìm, so sánh và hiểu các listing synthetic trên HomeScope.";
    }
    if (classification.category === "unsafe") {
      return "Mình chỉ hỗ trợ thông tin bất động sản HomeScope ở mức tham khảo, không thay thế tư vấn pháp lý hoặc tài chính. Bạn có thể hỏi mình về listing, bộ lọc, khu vực hoặc cách dùng HomeScope.";
    }
    return "Mình chỉ hỗ trợ tìm kiếm, so sánh và giải thích thông tin bất động sản trên HomeScope. Hãy cho mình biết ngân sách, khu vực/MRT, số phòng ngủ hoặc loại nhà bạn cần.";
  }
  if (classification.category === "prompt_injection") {
    return "I can’t follow requests to change my rules or reveal system prompts or secrets. I can help you find, compare, and understand HomeScope’s synthetic listings.";
  }
  if (classification.category === "unsafe") {
    return "I can only provide general HomeScope property information, not legal or financial advice. Ask me about listings, filters, neighbourhoods, or how to use HomeScope.";
  }
  return "I can only help with finding, comparing, and understanding properties on HomeScope. Tell me your budget, preferred area/MRT, bedrooms, or property type.";
}

export function inferLanguage(message: string): "vi" | "en" {
  return /[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/iu.test(message)
    || /\b(tôi|mình|căn|nhà|phòng|giá|khu|gần|tìm|muốn)\b/iu.test(message)
    ? "vi"
    : "en";
}
