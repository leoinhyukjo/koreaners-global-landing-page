/**
 * JSON-LD 안전한 직렬화 유틸리티
 *
 * JSON.stringify는 기본적으로 안전하지만,
 * </script> 태그 삽입 공격을 추가로 방어합니다.
 */

export function safeJsonLdStringify(obj: any): string {
  const jsonString = JSON.stringify(obj)

  // </script> 태그가 JSON 내부에 있을 경우를 대비한 추가 이스케이프
  // JSON.stringify는 이미 < > 를 \u003c \u003e 로 변환하지만
  // 만약의 경우를 대비해 이중 방어
  return jsonString
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--')
}
