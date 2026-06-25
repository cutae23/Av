import React, { useState, useEffect } from "react";
import {
  Sparkle,
  Sparkles,
  Shuffle,
  Grid,
  Scissors,
  Shirt,
  User,
  Heart,
  Image as ImageIcon,
  Palette,
  Eye,
  Smile,
  Check,
  RefreshCw,
  Download,
  Camera
} from "lucide-react";
import { AvatarParameters, PresetAvatar } from "./types";
import { PRESETS } from "./components/AvatarPresets";
import AvatarViewer from "./components/AvatarViewer";
import PhotoAnalyzer from "./components/PhotoAnalyzer";

// 30 EXP OPTIONS
const EXPRESSIONS = [
  { id: "happy", label: "신남 😊" },
  { id: "neutral", label: "평온 😐" },
  { id: "wink", label: "윙크 😉" },
  { id: "cool", label: "시크 😎" },
  { id: "surprised", label: "깜놀 😮" },
  { id: "crying", label: "슬픔 😭" },
  { id: "angry", label: "화남 😡" },
  { id: "excited", label: "짱신남 🤩" },
  { id: "sleepy", label: "졸림 🥱" },
  { id: "smug", label: "어쩔티비 😏" },
  { id: "sweating", label: "식은땀 😰" },
  { id: "drooling", label: "츄릅 🤤" },
  { id: "sad", label: "시무룩 🥺" },
  { id: "devil", label: "장난끼 😈" },
  { id: "shy", label: "부끄 😳" },
  { id: "dizzy", label: "멘붕 😵" },
  { id: "bored", label: "지루함 😑" },
  { id: "screaming", label: "경악 😱" },
  { id: "heart_eyes", label: "러블리 😍" },
  { id: "thinking", label: "고민중 🤔" },
  { id: "naughty", label: "메롱 😜" },
  { id: "pouting", label: "삐짐 😤" },
  { id: "disgusted", label: "불쾌 🤮" },
  { id: "sleeping", label: "잠듦 😴" },
  { id: "kissing", label: "쪽 😘" },
  { id: "stunned", label: "망연자실 👁️_👁️" },
  { id: "sparkle", label: "초롱 🌟" },
  { id: "scared", label: "오들오들 😨" },
  { id: "funny", label: "엽기 🤪" },
  { id: "confident", label: "기당당 😼" }
];

// 30 IRIS COLORS
const IRIS_COLORS = [
  { id: "#3b82f6", label: "딥 아쿠아" },
  { id: "#10b981", label: "초록 숲" },
  { id: "#ef4444", label: "레드 루비" },
  { id: "#ec4899", label: "베리 자두" },
  { id: "#8b5cf6", label: "퍼플 수정" },
  { id: "#f59e0b", label: "호박 골드" },
  { id: "#06b6d4", label: "하늘 바다" },
  { id: "#14b8a6", label: "민트 캔디" },
  { id: "#78350f", label: "헤이즐 밀크" },
  { id: "#111111", label: "오닉스 블랙" },
  { id: "#ffffff", label: "스노우 화이트" },
  { id: "#3d3d29", label: "카키 브라운" },
  { id: "#a8a29e", label: "안개 그레이" },
  { id: "#f472b6", label: "새콤 라일락" },
  { id: "#84cc16", label: "연두 새싹" },
  { id: "#f97316", label: "노을 주황" },
  { id: "#db2777", label: "핫 체리핀" },
  { id: "#2dd4bf", label: "에메랄드" },
  { id: "#a21caf", label: "우주 미드나잇" },
  { id: "#fb7185", label: "홍당무 핑크" },
  { id: "#5b21b6", label: "은하수 바이올렛" },
  { id: "#fbbf24", label: "레몬 레이드" },
  { id: "#059669", label: "깊은 담쟁이" },
  { id: "#0284c7", label: "구름 한 스푼" },
  { id: "#d97706" , label: "시나몬 구이" },
  { id: "#dc2626", label: "매혹 장미" },
  { id: "#fbcfe8", label: "딸기 마카롱" },
  { id: "#475569", label: "도시 정장그레이" },
  { id: "#60a5fa", label: "하늘 보석" },
  { id: "#f87171", label: "자몽 자몽" }
];

// 30 MOVEMENT LOOPS (KAKAOTALK FRIENDLY)
const MOVEMENTS = [
  { id: "idle", label: "기본 숨쉬기 🧘" },
  { id: "dance", label: "신나는 흔들댄스 🕺" },
  { id: "wave", label: "반갑게 손 흔들기 👋" },
  { id: "heart_loop", label: "사랑의 손하트 💖" },
  { id: "thumbs_up", label: "따봉 최고 날리기 👍" },
  { id: "shiver", label: "덜덜덜 춥고 오싹 😨" },
  { id: "cry_sob", label: "폭풍 통곡 눈물바다 😭" },
  { id: "angry_stomp", label: "쿵쾅쿵쾅 심술 분노 😡" },
  { id: "sleepy_head", label: "꾸벅꾸벅 잠 졸기 😪" },
  { id: "shy_wiggle", label: "부끄부끄 몸배배 꼬기 😳" },
  { id: "flight", label: "차분한 둥실 날기 🛸" },
  { id: "jumping", label: "폴짝폴짝 높이뛰기 🐰" },
  { id: "bowing", label: "90도 꾸벅 폴더인사 🙇" },
  { id: "laughing", label: "바닥 뒹굴며 깔깔깔 😂" },
  { id: "facepalm", label: "이마 탁! 뒷목 잡기 🤦" },
  { id: "exploding", label: "우주의 기운 초열정 🔥" },
  { id: "running", label: "허겁지겁 숨차게 달리기 🏃" },
  { id: "sneaking", label: "슬금슬금 살금걸음 🥷" },
  { id: "clapping", label: "물개 손박수 갈채 👏" },
  { id: "thinking", label: "머리를 긁적 고민중 🧐" },
  { id: "saluting", label: "늠름 거수 경례! 🫡" },
  { id: "rockout", label: "머리 흔들며 락앤롤 🎸" },
  { id: "begging", label: "젭라 싹싹 빌기 비나이다 🙏" },
  { id: "yawning", label: "하암 입벌려 기지개 🥱" },
  { id: "boxing", label: "슉슉 날렵 잽 펀치 🥊" },
  { id: "dizzy_spin", label: "눈이 빙글뱅글 어지럼 😵" },
  { id: "surprised_hop", label: "깜놀 기절초풍 점프 🙀" },
  { id: "flying_kiss", label: "사랑의 미사일 키스 쪽 😘" },
  { id: "sweat_drop", label: "땀을 흐르는 흠칫 💦" },
  { id: "victory_v", label: "승리의 볼콕 브이 ✌️" }
];

// 30 HAIR STYLES
const HAIR_STYLES = [
  { id: "short", label: "반듯 댄디컷 👦" },
  { id: "spiky", label: "고슴도치 투블럭 ⚡" },
  { id: "curly", label: "뽀글이 라면머리 🧑‍🦱" },
  { id: "bob", label: "단정한 찰랑단발 👩" },
  { id: "long", label: "청순 생머리 👧" },
  { id: "ponytail", label: "발랄 포니테일 👱‍♀️" },
  { id: "afro", label: "볼륨 만점 아프로 👨‍🦱" },
  { id: "twintail", label: "상큼 양갈래 머리 👧" },
  { id: "mohican", label: "마라맛 모히칸 👹" },
  { id: "undercut", label: "스트릿 언더컷 💈" },
  { id: "reggae", label: "자메이카 레게 🛹" },
  { id: "leaf", label: "감성 가득 리프컷 🍃" },
  { id: "hime", label: "공주풍 히메컷 👸" },
  { id: "bangs", label: "이마 폭 뱅앞머리 💇‍♀️" },
  { id: "sidesweep", label: "시크한 쉼표 가르마 🤠" },
  { id: "samurai", label: "역전 사무라이 꽁지 🗡️" },
  { id: "elvis", label: "소라빵 엘비스 록스타 🎙️" },
  { id: "spacebuns", label: "귀여운 번스 만두 🥟" },
  { id: "witch", label: "여신 롱 웨이브 🪄" },
  { id: "braids", label: "단아하게 땋은 머리 🎀" },
  { id: "slickback", label: "백만장자 올백머리 🤵" },
  { id: "wolf", label: "거친 울프 샤기 헤어 🐺" },
  { id: "perm", label: "자연스러운 파도펌 🌊" },
  { id: "mushroom", label: "장난꾸러기 바가지 🍄" },
  { id: "shaggy", label: "빈티지 샤기 헤어 🎸" },
  { id: "part", label: "도시적인 반갈 헤어 🏙️" },
  { id: "twintail_braid", label: "소녀풍 땋은 양갈래 👒" },
  { id: "bowl", label: "가위바위보 바가지 🧒" },
  { id: "pixie", label: "걸크러시 숏 픽시 🧚" },
  { id: "bald", label: "빛나는 매끈 대머리 🦲" }
];

// 30 TOP OUTFITS (위옷)
const TOP_OUTFITS = [
  { id: "shirt", label: "깔끔한 카라 셔츠 👕" },
  { id: "hoodie", label: "폭신한 오버핏 후드 🧥" },
  { id: "suit", label: "시그니처 면접 정장 👔" },
  { id: "sweater", label: "뜨끈 니트 스웨터 🧶" },
  { id: "police", label: "용감한 경찰 제복 👮" },
  { id: "sailor", label: "세일러 마린 카라 ⚓" },
  { id: "hanbok", label: "곱디고운 전통 한복 저고리 🌸" },
  { id: "pajama", label: "체크 수면 보송 잠옷 💤" },
  { id: "chef", label: "셰프 마스터 더블 자켓 🍳" },
  { id: "detective", label: "트렌치 코트 바바리 🕵️" },
  { id: "bomber", label: "바이크 마원 항공점퍼 🏍️" },
  { id: "jersey", label: "삼선 아디 츄리닝 져지 🛹" },
  { id: "overalls", label: "데님 오버롤스 상체 👖" },
  { id: "turtleneck", label: "도회적인 시크 터틀넥 ☕" },
  { id: "spacesuit", label: "나사 우주비행사 정복 🚀" },
  { id: "raincoat", label: "샛노란 빗방울 우비 ☔" },
  { id: "hawaiian", label: "휴양지 야자 하와이안 🌴" },
  { id: "leather", label: "바이커 가죽 라이더 자켓 🎸" },
  { id: "suspenders", label: "레트로 멜빵 타이탑 🎩" },
  { id: "scubasuit", label: "바다 잠수 해녀 다이버 슈트 🤿" },
  { id: "cape", label: "해리포터 호그와트 망토 🪄" },
  { id: "croptop", label: "스트릿 힙 무드 크롭티 🎵" },
  { id: "dragon_robe", label: "근엄 폭발 조선 임금님 곤룡포 🐉" },
  { id: "vampire", label: "드라큘라 백작 벨벳 코트 🧛" },
  { id: "sleeveless", label: "헬스장 3대 500 삼대 나시 💪" },
  { id: "baseball", label: "과잠 바시티 야구 자켓 ⚾" },
  { id: "padding", label: "검은색 방탄 패딩 롱패딩 ❄️" },
  { id: "maid", label: "빅토리안 메이드 드레스 🔔" },
  { id: "mummy", label: "미라 압박 흰 붕대 🧟" },
  { id: "santa", label: "루돌프와 메리 산타복 🎅" }
];

// 30 BOTTOM CLOTHES (아래옷)
const BOTTOM_CLOTHES = [
  { id: "trousers", label: "댄디 일자 면바지 👖" },
  { id: "shorts", label: "시원한 반바지 🩳" },
  { id: "jeans", label: "워싱 데님 청바지 👖" },
  { id: "sweatpants", label: "편한 회색 트레이닝 바지 👟" },
  { id: "sailor_skirt", label: "주름 테니스 스쿨치마 👗" },
  { id: "hanbok_skirt", label: "풍성한 한복 비단치마 🌸" },
  { id: "pajama_pants", label: "보들 수면 잠옷바지 💤" },
  { id: "suit_pants", label: "칼주름 수트 슬랙스 🕴️" },
  { id: "chef_pants", label: "방수 주방 요리사 바지 👨‍🍳" },
  { id: "overalls_denim", label: "데님 오버롤 멜빵바지 하의 👖" },
  { id: "detective_pants", label: "클래식 체크 면슬랙스 📜" },
  { id: "leggings", label: "요가 쫀쫀 레깅스 팬츠 🧘‍♀️" },
  { id: "space_pants", label: "방열 우주 전투복 바지 🛸" },
  { id: "harem_pants", label: "알라딘 댄서 하렘 바지 🕌" },
  { id: "leather_leggings", label: "모터 싸이클 가죽 타이트 팬츠 🖤" },
  { id: "hawaiian_shorts", label: "트로피컬 수영 반바지 👙" },
  { id: "cargo_pants", label: "양옆 포켓 건빵 카고바지 🪂" },
  { id: "tennis_skirt", label: "발랄 네온 테니스 치마 🎾" },
  { id: "cape_skirt", label: "마술 학교 유틸리티 하의 🔮" },
  { id: "scuba_pants", label: "스킨 스쿠버 인체형 탄성 하의 🏊" },
  { id: "mermaid_skirt", label: "보석 홀로그램 마린 치마 🧜‍♀️" },
  { id: "rainbow_leggings", label: "시선 강탈 하이무지개 바지 🌈" },
  { id: "royal_robe", label: "조선 왕조 비단단 실크 하의 🐉" },
  { id: "vampire_pants", label: "뱀파이어 고딕 슬림 바지 🍷" },
  { id: "gym_shorts", label: "러닝 헬스 기능성 쇼츠 🏃‍♂️" },
  { id: "baseball_pants", label: "화이트 야구부 유니폼 하의 ⚾" },
  { id: "padding_pants", label: "보온 패딩 바지 ⛄" },
  { id: "ruffle_skirt", label: "장식 프릴 레이스치마 🏵️" },
  { id: "mummy_wraps", label: "하반신 가닥가닥 미라 붕대 🤕" },
  { id: "santa_pants", label: "융단 재질 도톰 산타 바지 🔔" }
];

// SHOE TYPES (신발도 고르게)
const SHOE_TYPES = [
  { id: "sneakers", label: "산뜻한 캐주얼 운동화 👟" },
  { id: "boots", label: "세련된 도회지 통굽 워커 🥾" },
  { id: "shoes_ribbon", label: "소녀풍 리본 단화 로퍼 🩰" },
  { id: "sandals", label: "바람 솔솔 스포티 샌들 👡" },
  { id: "socks_only", label: "폭신폭신 무지개 긴 양말 🧦" },
  { id: "barefoot", label: "매끈매끈 오가닉 맨발 🦶" }
];

// 30 ACCESSORIES
const ACCESSORIES = [
  { id: "none", label: "장착 헤드 악세사리 없음 ❌" },
  { id: "classic_specs", label: "단정한 뿔테 안경 🤓" },
  { id: "round_specs", label: "메탈 원형 동글 안경 🧑‍🏫" },
  { id: "sunglasses", label: "스트릿 블랙 선글라스 😎" },
  { id: "visor", label: "사이버 미래 안광 고글 ⚡" },
  { id: "cap", label: "기본 야구 볼캡 모자 🧢" },
  { id: "beanie", label: "양모 뜨개질 방한 비니 👒" },
  { id: "crown", label: "다이아 국왕 럭셔리 왕관 👑" },
  { id: "headband", label: "테니스 스포츠 헤드밴드 🏸" },
  { id: "flower_crown", label: "요정의 정원 생화 화관 🌸" },
  { id: "halo", label: "축복 가득 천사 오라 링 😇" },
  { id: "cat_ears", label: "솜털 쫑긋 고양이 헤어밴드 🐱" },
  { id: "rabbit_ears", label: "귀가 길쭉 토끼 모자 🐰" },
  { id: "bunny_nose", label: "큐트 토끼 스티커/코 밴드 🩹" },
  { id: "angel_wings", label: "풍성하고 성스러운 천사 날개 👼" },
  { id: "demon_wings", label: "뾰족 악마 가죽 날개 😈" },
  { id: "cat_tail", label: "살랑살랑 꼬리 장식 🐈" },
  { id: "scarf", label: "빨간 크리스마스 목도리 🧣" },
  { id: "headphones", label: "라벤더 고음질 헤드폰 🎧" },
  { id: "face_mask", label: "블랙 메탈 스트릿 마스크 😷" },
  { id: "necklace", label: "플렉스 왕 골드 힙합 체인 🪙" },
  { id: "bowtie", label: "꼬마 신사 붉은 나비넥타이 🎀" },
  { id: "ribbon", label: "왕단추 프린세스 리본핀 🎗️" },
  { id: "eyepatch", label: "고독한 애꾸 해적 안대 🏴‍☠️" },
  { id: "monocle", label: "빅토리아 신사 모노클 안경 🧐" },
  { id: "piercing", label: "메탈 입술/코 피어싱 🧷" },
  { id: "chef_hat", label: "빵빵한 파티시에 셰프모자 👨‍🍳" },
  { id: "witch_hat", label: "마카롱 마법 마녀 고깔모 🧙‍♀️" },
  { id: "pipe", label: "비누방울 나오는 담뱃대 🫧" },
  { id: "pacifier", label: "응애 애기 쪽쪽이 완구 🍼" },
  { id: "star_specs", label: "파티용 오렌지 별 안경 ⭐" }
];

// 얼굴 형태 및 크기 관련 설정 추가
const FACE_SHAPES = [
  { id: "round", label: "동글동글 베이비 페이스 ⚪" },
  { id: "long", label: "의젓하고 갸름한 긴 얼굴 🥚" },
  { id: "square", label: "늠름하고 각진 사각 얼굴 🔲" },
  { id: "heart", label: "날렵한 하트형 V라인 💖" },
  { id: "chubby", label: "포동포동 볼살 통통 🐹" },
  { id: "slim", label: "슬림하고 시크한 달걀형 🥚" }
];

const FACE_SCALES = [
  { id: "small", label: "소형 머리 (소두 비율) 👤", value: 0.64 },
  { id: "normal", label: "보통 머리 (기본 Chibi) 👤", value: 0.72 },
  { id: "large", label: "대형 머리 (대두 강조형) 👤", value: 0.82 }
];

// 10 SHAPES FOR BROWS, EYES, NOSE, MOUTH, EARS
const EYEBROW_STYLES = [
  { id: "flat", label: "일자눈썹 (Clean Flat) ➖" },
  { id: "curved", label: "둥근 아치 (Elegant Curved) 〰" },
  { id: "thick", label: "송승헌 짱구 (Full Bushy) ◼" },
  { id: "slanted", label: "샤프 사선 (Sharp Slanted) ↗" },
  { id: "angry", label: "번개 분노 (Fierce Angry) ⚡" },
  { id: "sad", label: "팔자 울상 (Melodramatic Sad) 😢" },
  { id: "dots", label: "동글 마로 (Cute Dots) ••" },
  { id: "wavy", label: "물결 스네이크 (Dynamic Wavy) 🌊" },
  { id: "crossed", label: "칼자국 상처 (Rebel Scarred) ⚔" },
  { id: "none", label: "모나리자 민둥 (Invisible None) ❌" }
];

const EYE_STYLES = [
  { id: "round", label: "왕방울 초롱 (Innocent Round) 👀" },
  { id: "anime", label: "반짝반짝 모에눈 (Shiny Anime) ✨" },
  { id: "slit", label: "세로 칼눈 (Rebel Slit) 👁️" },
  { id: "star", label: "별을 품은 눈 (Star Pupil) ⭐" },
  { id: "heart", label: "하트 하트 눈 (Lovely Heart) ♥" },
  { id: "sleepy", label: "게으른 게슴츠레 (Sleepy Eye) 🥱" },
  { id: "fox", label: "날렵한 여우 가로눈 (Sleek Fox) 🦊" },
  { id: "classic", label: "단추구멍 초미니 (Humble Chibi) •" },
  { id: "spiral", label: "어지럼 미궁 뱅뱅 (Spiral Loop) 🌀" },
  { id: "closed", label: "사르르 반달 미소 (Closed Happy) 😊" }
];

const NOSE_STYLES = [
  { id: "button", label: "작고 소중한 루돌프코 🔴" },
  { id: "tall", label: "오뚝한 조각 콧대 📐" },
  { id: "pointy", label: "뾰족 피노키오  mũi👃" },
  { id: "broad", label: "구수한 마당발 주먹코 🍉" },
  { id: "snout", label: "뚱이 퉁퉁 개코 🐾" },
  { id: "long", label: "의젓한 길치 콧수염코 🥖" },
  { id: "heart_nose", label: "하트 모양 요정코 💖" },
  { id: "cat_nose", label: "아기 삼각 고양이코 🐱" },
  { id: "flat_nose", label: "매우 연한 납작 슬림코 👃" },
  { id: "pixel", label: "사각 복고 마인크래프트 🧱" }
];

const MOUTH_STYLES = [
  { id: "smile", label: "방글 포근 입꼬리 미소 👄" },
  { id: "gasp", label: "힉! 우와아 오벌 동그라미 😮" },
  { id: "neutral", label: "담담 가로선 립 ➖" },
  { id: "smirk", label: "어쩔 한쪽 비웃기 썩소 😏" },
  { id: "heart_mouth", label: "하트 우 하트입술 💝" },
  { id: "tongue", label: "메롱 낼름 장난꾸러기 😜" },
  { id: "vampire", label: "위풍당당 송곳니 귀신 🧛‍♀️" },
  { id: "pout", label: "시무룩 세모 삐짐 😡" },
  { id: "drool", label: "헤벌레 졸리 졸려 침 🤤" },
  { id: "chubby", label: "빵빵 동그라미 뽀뽀입 😚" }
];

const EAR_STYLES = [
  { id: "round", label: "둥근 찹쌀떡 기본 귀 👂" },
  { id: "pointy", label: "인어 숲 엘프 뾰족귀 🧝‍♀️" },
  { id: "elephant", label: "덤보 점보 코끼리귀 🐘" },
  { id: "droop", label: "비글 강아지 처진 멍뭉귀 🐶" },
  { id: "cat_ear", label: "복실 핑거 전방 고양이 귀 🐾" },
  { id: "piercing", label: "스틸 링 피어싱 세 귀 💍" },
  { id: "star", label: "달빛 드롭 별귀걸이 귀 ⭐" },
  { id: "earbuds", label: "무선 노이즈캔슬 이어폰 🎧" },
  { id: "earmuffs", label: "체크 털장식 포근 귀마개 🐇" },
  { id: "spiral_bot", label: "금속 태엽 사이보그 기계귀 ⚙️" }
];

// 8 SITUATIONAL SCENERY BACKGROUNDS
const SITUATIONAL_BACKGROUNDS = [
  { id: "cafe", name: "감성 한옥 카페 ☕", gradient: "from-[#F5EBE6] via-[#E4D1C3] to-[#C9A790]", emoji: "☕", d3Light: "cafe" },
  { id: "room", name: "아늑한 비밀 방 🛋️", gradient: "from-[#FAF5FF] via-[#EBE0FF] to-[#D5C2FE]", emoji: "🛋️", d3Light: "room" },
  { id: "school", name: "청춘 학교 교실 🏫", gradient: "from-[#E6F4F8] via-[#C9E7F0] to-[#99D2E2]", emoji: "🏫", d3Light: "school" },
  { id: "subway", name: "심야 철도 지하철 🚇", gradient: "from-[#ECEFF1] via-[#CFD8DC] to-[#90A4AE]", emoji: "🚇", d3Light: "subway" },
  { id: "hanriver", name: "한강공원 피크닉 ⛺", gradient: "from-[#F0FDF4] via-[#DCFCE7] to-[#86EFAC]", emoji: "⛺", d3Light: "hanriver" },
  { id: "beach", name: "에메랄드빛 해변 🏖️", gradient: "from-[#FFFBEB] via-[#FEF3C7] to-[#FDE047]", emoji: "🏖️", d3Light: "beach" },
  { id: "cyberpunk", name: "홍대 네온 골목길 🌃", gradient: "from-[#020617] via-[#1e1b4b] to-[#311042]", emoji: "🌃", d3Light: "cyberpunk" },
  { id: "library", name: "고요한 서재 📚", gradient: "from-[#FEFBF6] via-[#F4EBE1] to-[#E3CAA5]", emoji: "📚", d3Light: "library" }
];

export default function App() {
  const [appMode, setAppMode] = useState<"editor">("editor");
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);
  
  // Current active avatar parameters starting with a super cute female model
  const [avatar, setAvatar] = useState<AvatarParameters>({
    gender: "female",
    hairStyle: "twintail",
    hairColor: "#ec4899", // Vivid pink hair
    skinColor: "#ffe4e6", // Soft rosy skin
    eyeColor: "#06b6d4", // Sky blue iris
    expression: "happy",
    clothingType: "sailor",
    clothingColor: "#1e3a8a", // Sailor navy
    bottomType: "sailor_skirt",
    bottomColor: "#1e3a8a", // Sailor skirt matching
    accessory: "headphones",
    eyebrowsStyle: "flat",
    eyeStyle: "anime",
    noseStyle: "button",
    mouthStyle: "smile",
    earStyle: "round",
    background: "cafe",
    facialHair: "none",
    facialHairColor: "#1e293b",
    shoeType: "sneakers",
    shoeColor: "#ffffff",
    faceShape: "round",
    faceScale: 0.72,
    summaryText: "여성스러운 볼콕 해상 세일러 복장과 핑크빛 양갈래 롤을 지닌 고요하고 큐트한 수제 캐릭터."
  });

  const [activeTab, setActiveTab] = useState<"face" | "hair" | "clothes" | "features">("face");
  const [showColorPicker, setShowColorPicker] = useState<"skin" | "hair" | "eye" | "top" | "bottom" | "shoe" | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem("custom_gemini_api_key") || "";
  });
  const [showMainApiKeyGuide, setShowMainApiKeyGuide] = useState(false);

  // Randomize all characteristics logically
  const handleRandomize = () => {
    const genders = ["male", "female"];
    
    const rGender = genders[Math.floor(Math.random() * genders.length)];
    const rHair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const rExpression = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)].id;
    const rTop = TOP_OUTFITS[Math.floor(Math.random() * TOP_OUTFITS.length)].id;
    const rBottom = BOTTOM_CLOTHES[Math.floor(Math.random() * BOTTOM_CLOTHES.length)].id;
    const rShoe = SHOE_TYPES[Math.floor(Math.random() * SHOE_TYPES.length)].id;
    const rAccessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;
    
    const rBrow = EYEBROW_STYLES[Math.floor(Math.random() * EYEBROW_STYLES.length)].id;
    const rEyeStyl = EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)].id;
    const rNose = NOSE_STYLES[Math.floor(Math.random() * NOSE_STYLES.length)].id;
    const rMouth = MOUTH_STYLES[Math.floor(Math.random() * MOUTH_STYLES.length)].id;
    const rEar = EAR_STYLES[Math.floor(Math.random() * EAR_STYLES.length)].id;
    const rBg = SITUATIONAL_BACKGROUNDS[Math.floor(Math.random() * SITUATIONAL_BACKGROUNDS.length)].id;

    const rColor = () => IRIS_COLORS[Math.floor(Math.random() * IRIS_COLORS.length)].id;
    
    setAvatar({
      gender: rGender,
      hairStyle: rHair,
      hairColor: rColor(),
      skinColor: ["#ffe4e6", "#ffdbac", "#f1c27d", "#e0ac69", "#c68642"][Math.floor(Math.random() * 5)],
      eyeColor: rColor(),
      expression: rExpression,
      clothingType: rTop,
      clothingColor: rColor(),
      bottomType: rBottom,
      bottomColor: rColor(),
      accessory: rAccessory,
      eyebrowsStyle: rBrow,
      eyeStyle: rEyeStyl,
      noseStyle: rNose,
      mouthStyle: rMouth,
      earStyle: rEar,
      background: rBg,
      facialHair: rGender === "male" && Math.random() > 0.6 ? "beard" : "none",
      facialHairColor: rColor(),
      shoeType: rShoe,
      shoeColor: rColor(),
      faceShape: FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)].id,
      faceScale: FACE_SCALES[Math.floor(Math.random() * FACE_SCALES.length)].value,
      summaryText: "인공지능 무작위 조합 알고리즘에 의해 새롭게 빌드된 큐트한 전신 3D 피규어."
    });
  };

  // Preset avatar click
  const handleLoadPreset = (preset: PresetAvatar) => {
    setAvatar({ ...preset.avatar });
  };

  // Get active background info
  const activeBg = SITUATIONAL_BACKGROUNDS.find(bg => bg.id === avatar.background) || SITUATIONAL_BACKGROUNDS[0];

  return (
    <div className="min-h-screen bg-[#F0EFF4] text-[#33323D] flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. COMPACT BEAUTIFUL HEADER (NO ANALYSIS OPTIONS) */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-[#E1DEE6] px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div id="app-logo-area" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#9B51E0] to-[#E051AE] rounded-xl flex items-center justify-center text-white shadow-sm">
            <Sparkle className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-serif italic tracking-tight font-black text-[#5C218B]">
              PersonaGen 3D Chibi Studio
            </h1>
            <p className="text-[9px] font-bold text-[#8C8894] uppercase tracking-widest mt-0.5">
              3D AVATAR MAKER • 30+ EXPRESSIONS & ACCESSORIES
            </p>
          </div>
        </div>

        {/* TOP LEVEL ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {/* Preset Buttons preview */}
          <div className="hidden md:flex items-center gap-1.5 mr-4 bg-[#F0EFF4] p-1 rounded-full border border-[#DCD9E3]">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                id={`top-preset-${preset.id}`}
                onClick={() => handleLoadPreset(preset)}
                className="w-7 h-7 flex items-center justify-center text-sm rounded-full bg-white hover:bg-[#F9F8FA] border border-transparent hover:border-[#DCD9E3] shadow-xs cursor-pointer transition-transform duration-200 active:scale-90"
                title={preset.name}
              >
                {preset.emoji}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPhotoAnalyzer(true)}
            id="btn-open-photo-analyzer"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#E051AE] to-[#9B51E0] hover:opacity-95 active:scale-95 text-white text-xs font-bold rounded-full cursor-pointer transition-all shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>사진 불러오기 (AI)</span>
          </button>

          <button
            onClick={handleRandomize}
            id="btn-quick-randomize"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF9FC] hover:bg-[#F0EFF4] active:scale-95 text-[#33323D] border border-[#DCD9E3] text-xs font-bold rounded-full cursor-pointer transition-all shadow-sm"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>랜덤 커스텀 조합</span>
          </button>
        </div>
      </header>

      {/* 2. THE CHAT/WORK CONTAINER AREA */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* COLUMN LEFT: Main Stage holding Interactive 3D Canvas with background custom color gradient */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          
          <div className={`relative flex flex-col flex-grow rounded-[32px] overflow-hidden bg-gradient-to-b ${activeBg.gradient} p-1 transition-all duration-500 shadow-sm border border-[#DCD9E3]`}>
            {/* Absolute indicator for location backdrop overlay */}
            <div className="absolute top-4 left-4 z-10 font-bold text-xxs font-mono bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#DCD9E3] text-[#5C218B] shadow-xs flex items-center gap-1.5">
              <span>{activeBg.emoji}</span>
              <span>현재 위치: {activeBg.name}</span>
            </div>

            {/* AvatarViewer 3D Component */}
            <div className="flex-grow relative rounded-[28px] overflow-hidden">
              <AvatarViewer
                avatar={avatar}
                animation={avatar.expression as any} // map movement or state directly to trigger
              />
            </div>
          </div>

          {/* Preset Stories/Context Box generated by sandbox rules */}
          {avatar.summaryText && (
            <div className="bg-white border border-[#DCD9E3] rounded-[24px] p-4.5 shadow-xs flex gap-3.5 items-start">
              <div className="p-2 bg-[#F0EFF4] text-[#9B51E0] rounded-xl shrink-0">
                <Sparkles className="w-4 h-4 animate-bounce" />
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-[#8C8894] uppercase tracking-widest font-mono">
                    3D CHIBI CHARACTER IDENTITY
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-md bg-[#e3dcf7] text-[#5c218b]">
                    {avatar.gender === "female" ? "여성 / Female" : "남성 / Male"}
                  </span>
                </div>
                <p className="text-xs text-[#33323D] font-serif leading-relaxed mt-1.5 bg-[#FAF9FC] p-2.5 rounded-xl border border-[#ECEAF0]">
                  "{avatar.summaryText}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN RIGHT: 3D Properties Customization control Panel */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white border border-[#DCD9E3] rounded-[32px] p-5.5 shadow-sm flex flex-col justify-between max-h-[780px] overflow-hidden">
          <div className="flex flex-col overflow-hidden">
            
            {/* ALWAYS-VISIBLE API Key Box */}
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50/70 to-pink-50/30 border border-[#9B51E0]/15 rounded-2xl space-y-2 shadow-xs shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9B51E0] animate-pulse" />
                  <span className="text-[11px] font-extrabold text-[#5C218B] flex items-center gap-1">
                    🔑 Gemini API 개인 키 등록 (선택)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMainApiKeyGuide(!showMainApiKeyGuide)}
                  className="text-[10px] text-[#9B51E0] hover:underline font-extrabold cursor-pointer px-1.5 py-0.5 bg-white border border-[#9B51E0]/15 rounded"
                >
                  {showMainApiKeyGuide ? "설명 닫기 ✕" : "무료 키 얻는 법 ➔"}
                </button>
              </div>

              {showMainApiKeyGuide && (
                <div className="text-[10px] text-[#5C5766] leading-relaxed bg-white border border-[#E1DEE6] p-3 rounded-xl space-y-1.5 animate-scale-up max-h-[180px] overflow-y-auto">
                  <p className="font-bold text-[#9B51E0] flex items-center gap-1">
                    💡 Gemini API 키는 진짜 무료인가요?
                  </p>
                  <p className="pl-1 text-slate-500">
                    네! Google AI Studio에서 제공하는 개인용 키는 분당 15회, 하루 수천 개 요청이 <span className="text-emerald-600 font-extrabold">100% 무료</span>입니다. 개인 키 등록 시 웹 브라우저에서 독립된 고속 구동이 보장됩니다.
                  </p>
                  <p className="font-bold text-[#5C218B] mt-1.5 flex items-center gap-1">
                    🚀 30초 무료 API 키 발급 순서:
                  </p>
                  <ol className="list-decimal list-inside pl-1 space-y-1 text-slate-500">
                    <li>
                      <a 
                        href="https://aistudio.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#9B51E0] font-extrabold underline hover:text-[#823EB8]"
                      >
                        Google AI Studio
                      </a>
                      에서 무료 구글 계정으로 로그인합니다.
                    </li>
                    <li>
                      상단의 파란색 <span className="font-bold text-slate-700">"Get API key"</span> 버튼을 눌러 새 키를 받습니다.
                    </li>
                    <li>
                      생성된 키(<span className="font-mono text-red-500 bg-slate-50 px-1 rounded text-[10px]">AIzaSy...</span>)를 아래 빈 칸에 고스란히 복사-붙여넣기 하세요!
                    </li>
                  </ol>
                </div>
              )}

              <div className="flex gap-1.5 pt-0.5">
                <input
                  type="password"
                  placeholder="AIzaSy로 시작하는 나만의 무료 Gemini API 키 입력"
                  value={userApiKey}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setUserApiKey(val);
                    if (val) {
                      localStorage.setItem("custom_gemini_api_key", val);
                    } else {
                      localStorage.removeItem("custom_gemini_api_key");
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs border border-[#DCD9E3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9B51E0] focus:border-[#9B51E0] bg-white font-mono placeholder:font-sans text-slate-800 shadow-3xs"
                />
                {userApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserApiKey("");
                      localStorage.removeItem("custom_gemini_api_key");
                    }}
                    className="px-2 py-1.5 text-[10px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-extrabold border border-rose-200 bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="text-[9px] text-[#8C8894] leading-normal font-medium">
                {userApiKey ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    ✓ 나만의 초고속 개인 API 키가 안전하게 적용되었습니다!
                  </span>
                ) : (
                  "💡 공용 공유 서버를 임시 활용 중입니다. 무료 개인 키를 등록하면 Vercel의 분석 실패/지연이 완벽히 해결됩니다."
                )}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-[#F0EFF4] p-1 rounded-2xl border border-[#DCD9E3] mb-4">
              {[
                { id: "face" as const, label: "얼굴 스타일", icon: User },
                { id: "hair" as const, label: "헤어 스타일", icon: Scissors },
                { id: "clothes" as const, label: "아바타 옷", icon: Shirt },
                { id: "features" as const, label: "장식 • 배경", icon: Grid },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`layout-tab-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowColorPicker(null);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 text-[10px] font-bold rounded-xl transition-all ${
                      active
                        ? "bg-white text-[#5C218B] shadow-xs border border-[#E1DEE6] font-black"
                        : "text-[#8C8894] hover:text-[#5C218B] border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SCROLLABLE LIST OF ALL RICH SUB-CATEGORIES AND 30+ ITEMS */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-5 max-h-[460px] md:max-h-[500px] scrollbar-thin">
              
              {/* TAB 1: FACE & IDENTITY PARAMETERS */}
              {activeTab === "face" && (
                <div className="space-y-4">
                  
                  {/* Gender Select (Male & Female Only - Face Neutral is deleted!) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex items-center gap-1">
                      <span>👥 아바타 성별 (Gender)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="gender-btn-male"
                        onClick={() => setAvatar({ ...avatar, gender: "male", facialHair: "none" })}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          avatar.gender === "male"
                            ? "bg-[#5C218B] text-white border-transparent"
                            : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                        }`}
                      >
                        남성 (Male 🤵)
                      </button>
                      <button
                        id="gender-btn-female"
                        onClick={() => setAvatar({ ...avatar, gender: "female", facialHair: "none" })}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          avatar.gender === "female"
                            ? "bg-[#5C218B] text-white border-transparent"
                            : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                        }`}
                      >
                        여성 (Female 👩)
                      </button>
                    </div>
                  </div>

                  {/* 얼굴 형태 (Face Shape) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex items-center gap-1">
                      <span>👤 얼굴 형태 (Face Shape - 6종)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FACE_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          id={`face-shape-${shape.id}`}
                          onClick={() => setAvatar({ ...avatar, faceShape: shape.id })}
                          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            (avatar.faceShape || "round") === shape.id
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 얼굴 크기 (Face Size/Scale) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex items-center gap-1">
                      <span>📏 얼굴 크기 비율 (Face Scale - 3종)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {FACE_SCALES.map((scale) => (
                        <button
                          key={scale.id}
                          id={`face-scale-${scale.id}`}
                          onClick={() => setAvatar({ ...avatar, faceScale: scale.value })}
                          className={`py-1.5 px-1 text-[10px] font-bold rounded-xl border text-center cursor-pointer transition-all ${
                            (avatar.faceScale || 0.72) === scale.value
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {scale.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 10 Brow shapes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      〰️ 눈썹 스타일 (Eyebrows Style - 10종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EYEBROW_STYLES.map((style) => (
                        <button
                          key={style.id}
                          id={`eyebrow-style-${style.id}`}
                          onClick={() => setAvatar({ ...avatar, eyebrowsStyle: style.id })}
                          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.eyebrowsStyle === style.id
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 10 Eye shapes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👁️ 눈 가로선 모양 (Eyes Style - 10종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EYE_STYLES.map((style) => (
                        <button
                          key={style.id}
                          id={`eye-style-${style.id}`}
                          onClick={() => setAvatar({ ...avatar, eyeStyle: style.id })}
                          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.eyeStyle === style.id
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 30 Iris Colors selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex justify-between">
                      <span>🎨 눈동자 컬러 (Iris Color - 30종)</span>
                      <span className="font-mono text-[#5C218B]">{avatar.eyeColor}</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 bg-[#FAF9FC] p-2.5 rounded-2xl border border-[#DCD9E3]">
                      {IRIS_COLORS.map((item) => (
                        <button
                          key={item.id}
                          id={`iris-color-${item.id}`}
                          onClick={() => setAvatar({ ...avatar, eyeColor: item.id })}
                          style={{ backgroundColor: item.id }}
                          className={`w-7 h-7 rounded-lg border border-white cursor-pointer relative shadow-xs flex items-center justify-center transition-transform hover:scale-110 active:scale-95`}
                          title={item.label}
                        >
                          {avatar.eyeColor.toLowerCase() === item.id.toLowerCase() && (
                            <Check className="w-4 h-4 text-white stroke-[3.5] drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 10 Nose shapes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👃 코 디자인 모양 (Nose Style - 10종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {NOSE_STYLES.map((style) => (
                        <button
                          key={style.id}
                          id={`nose-style-${style.id}`}
                          onClick={() => setAvatar({ ...avatar, noseStyle: style.id })}
                          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.noseStyle === style.id
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 10 Mouth structures */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👄 입술 및 입꼬리 스타일 (Mouth Style - 10종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MOUTH_STYLES.map((style) => (
                        <button
                          key={style.id}
                          id={`mouth-style-${style.id}`}
                          onClick={() => setAvatar({ ...avatar, mouthStyle: style.id })}
                          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.mouthStyle === style.id
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 10 Ear types */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👂 귀 디테일 스타일 (Ears Style - 10종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EAR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          id={`ear-style-${style.id}`}
                          onClick={() => setAvatar({ ...avatar, earStyle: style.id })}
                          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.earStyle === style.id
                              ? "bg-[#9B51E0] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skin Tone Selection and Color Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex justify-between">
                      <span>🎨 피부톤 지정 (Skin Tone)</span>
                      <span className="font-mono text-[#5C218B]">{avatar.skinColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["#ffe4e6", "#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#76e3fc", "#d4fc79"].map((color) => (
                        <button
                          key={color}
                          id={`skin-col-${color}`}
                          onClick={() => setAvatar({ ...avatar, skinColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-full border cursor-pointer relative ${
                            avatar.skinColor.toLowerCase() === color.toLowerCase()
                              ? "ring-2 ring-[#5C218B] scale-105 shadow-sm"
                              : "border-[#DCD9E3]"
                          }`}
                        >
                          {avatar.skinColor.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-4 h-4 text-white stroke-[3.5] absolute inset-0 m-auto drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === "skin" ? null : "skin")}
                        className="w-7 h-7 rounded-full border border-[#DCD9E3] text-[#5C218B] bg-white flex items-center justify-center hover:bg-[#FAF9FC] cursor-pointer"
                        title="임의의 커스텀 필터"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    </div>

                    {showColorPicker === "skin" && (
                      <div className="bg-[#FAF9FC] p-3 rounded-2xl border border-[#DCD9E3] flex flex-col gap-1.5 animate-fade-in">
                        <input
                          type="color"
                          value={avatar.skinColor}
                          onChange={(e) => setAvatar({ ...avatar, skinColor: e.target.value })}
                          className="w-full h-9 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[10px] text-center text-[#8C8894] font-medium">슬라이더를 드래그하여 임의의 피부톤을 맞추세요.</span>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: HAIR SELECTION */}
              {activeTab === "hair" && (
                <div className="space-y-4">
                  
                  {/* Hair Style (30 styles grid) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      💇‍♂️ 머리카락 헤어 모델 지정 (Hair Style - 30종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {HAIR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          id={`hair-select-${style.id}`}
                          onClick={() => setAvatar({ ...avatar, hairStyle: style.id })}
                          className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.hairStyle === style.id
                              ? "bg-[#5C218B] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Color preset palette and fine picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex justify-between">
                      <span>🎨 헤어 염색 (Hair Color)</span>
                      <span className="font-mono text-[#5C218B]">{avatar.hairColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["#1e293b", "#ec4899", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#78350f", "#ffffff", "#4b5563"].map((color) => (
                        <button
                          key={color}
                          id={`hair-col-${color}`}
                          onClick={() => setAvatar({ ...avatar, hairColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-full border cursor-pointer relative ${
                            avatar.hairColor.toLowerCase() === color.toLowerCase()
                              ? "ring-2 ring-[#5C218B] scale-105 shadow-sm"
                              : "border-[#DCD9E3]"
                          }`}
                        >
                          {avatar.hairColor.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-4 h-4 text-white stroke-[3.5] absolute inset-0 m-auto drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === "hair" ? null : "hair")}
                        className="w-7 h-7 rounded-full border border-[#DCD9E3] text-[#5C218B] bg-white flex items-center justify-center hover:bg-[#FAF9FC] cursor-pointer"
                        title="임의의 염색 칩"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    </div>

                    {showColorPicker === "hair" && (
                      <div className="bg-[#FAF9FC] p-3 rounded-2xl border border-[#DCD9E3] flex flex-col gap-1.5 animate-fade-in">
                        <input
                          type="color"
                          value={avatar.hairColor}
                          onChange={(e) => setAvatar({ ...avatar, hairColor: e.target.value })}
                          className="w-full h-9 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Male Facial Hair option */}
                  {avatar.gender === "male" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                        🧔 수염 디테일 (Beard & Mustache)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "none", label: "면도 깔끔함" },
                          { id: "beard", label: "카리스마 수염" },
                          { id: "mustache", label: "콧수염" }
                        ].map((fh) => (
                          <button
                            key={fh.id}
                            id={`facial-hair-${fh.id}`}
                            onClick={() => setAvatar({ ...avatar, facialHair: fh.id })}
                            className={`py-2 px-2 text-[10px] font-bold rounded-xl border cursor-pointer transition-all ${
                              avatar.facialHair === fh.id
                                ? "bg-[#5C218B] text-white border-transparent"
                                : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                            }`}
                          >
                            {fh.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: CLOTHES & BOTTOMS SELECTION */}
              {activeTab === "clothes" && (
                <div className="space-y-4">
                  
                  {/* Top Garment (30 types) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👕 상의 카테고리 (Top Clothes - 30종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TOP_OUTFITS.map((item) => (
                        <button
                          key={item.id}
                          id={`top-outfit-${item.id}`}
                          onClick={() => setAvatar({ ...avatar, clothingType: item.id })}
                          className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.clothingType === item.id
                              ? "bg-[#5C218B] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Top Garment Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex justify-between">
                      <span>🎨 상의 색상 염색 (Top Color)</span>
                      <span className="font-mono text-[#5C218B]">{avatar.clothingColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["#1e3a8a", "#b91c1c", "#0d9488", "#1e1b4b", "#c026d3", "#059669", "#ea580c", "#1e293b", "#ffffff", "#eab308"].map((color) => (
                        <button
                          key={color}
                          id={`top-col-${color}`}
                          onClick={() => setAvatar({ ...avatar, clothingColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-full border cursor-pointer relative ${
                            avatar.clothingColor.toLowerCase() === color.toLowerCase()
                              ? "ring-2 ring-[#5C218B] scale-105 shadow-sm"
                              : "border-[#DCD9E3]"
                          }`}
                        >
                          {avatar.clothingColor.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-4 h-4 text-white stroke-[3.5] absolute inset-0 m-auto drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === "top" ? null : "top")}
                        className="w-7 h-7 rounded-full border border-[#DCD9E3] text-[#5C218B] bg-white flex items-center justify-center hover:bg-[#FAF9FC] cursor-pointer"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    </div>

                    {showColorPicker === "top" && (
                      <div className="bg-[#FAF9FC] p-3 rounded-2xl border border-[#DCD9E3] flex flex-col gap-1.5 animate-fade-in">
                        <input
                          type="color"
                          value={avatar.clothingColor}
                          onChange={(e) => setAvatar({ ...avatar, clothingColor: e.target.value })}
                          className="w-full h-9 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bottom Clothes (30 types) - 다리 추가에 부합하는 하의! */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👖 하의 및 레깅스/치마 카테고리 (Bottom Clothes - 30종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {BOTTOM_CLOTHES.map((item) => (
                        <button
                          key={item.id}
                          id={`bottom-outfit-${item.id}`}
                          onClick={() => setAvatar({ ...avatar, bottomType: item.id })}
                          className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.bottomType === item.id
                              ? "bg-[#5C218B] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex justify-between">
                      <span>🎨 하의 색상 지정 (Bottom Color)</span>
                      <span className="font-mono text-[#5C218B]">{avatar.bottomColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["#1e293b", "#334155", "#1e3b8a", "#be123c", "#4c1d95", "#047857", "#d97706", "#ffffff", "#475569", "#0284c7"].map((color) => (
                        <button
                          key={color}
                          id={`bottom-col-${color}`}
                          onClick={() => setAvatar({ ...avatar, bottomColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-full border cursor-pointer relative ${
                            avatar.bottomColor.toLowerCase() === color.toLowerCase()
                              ? "ring-2 ring-[#5C218B] scale-105 shadow-sm"
                              : "border-[#DCD9E3]"
                          }`}
                        >
                          {avatar.bottomColor.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-4 h-4 text-white stroke-[3.5] absolute inset-0 m-auto drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === "bottom" ? null : "bottom")}
                        className="w-7 h-7 rounded-full border border-[#DCD9E3] text-[#5C218B] bg-white flex items-center justify-center hover:bg-[#FAF9FC] cursor-pointer"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    </div>

                    {showColorPicker === "bottom" && (
                      <div className="bg-[#FAF9FC] p-3 rounded-2xl border border-[#DCD9E3] flex flex-col gap-1.5 animate-fade-in">
                        <input
                          type="color"
                          value={avatar.bottomColor}
                          onChange={(e) => setAvatar({ ...avatar, bottomColor: e.target.value })}
                          className="w-full h-9 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Shoes Category (신발도 고르게) */}
                  <div className="space-y-1.5 pt-2 border-t border-[#FAF9FC]">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👟 신발 및 부츠 카테고리 (Shoes - 6종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SHOE_TYPES.map((item) => (
                        <button
                          key={item.id}
                          id={`shoe-pick-${item.id}`}
                          onClick={() => setAvatar({ ...avatar, shoeType: item.id })}
                          className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            (avatar.shoeType || "sneakers") === item.id
                              ? "bg-[#5C218B] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shoes Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider flex justify-between">
                      <span>🎨 신발 색상 지정 (Shoes Color)</span>
                      <span className="font-mono text-[#5C218B]">{avatar.shoeColor || "#ffffff"}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["#ffffff", "#000000", "#1e3a8a", "#be123c", "#4c1d95", "#047857", "#d97706", "#f43f5e", "#0ea5e9", "#eab308"].map((color) => (
                        <button
                          key={color}
                          id={`shoe-col-${color}`}
                          onClick={() => setAvatar({ ...avatar, shoeColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-full border cursor-pointer relative ${
                            (avatar.shoeColor || "#ffffff").toLowerCase() === color.toLowerCase()
                              ? "ring-2 ring-[#5C218B] scale-105 shadow-sm"
                              : "border-[#DCD9E3]"
                          }`}
                        >
                          {(avatar.shoeColor || "#ffffff").toLowerCase() === color.toLowerCase() && (
                            <Check className="w-4 h-4 text-white stroke-[3.5] absolute inset-0 m-auto drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === "shoe" ? null : "shoe")}
                        className="w-7 h-7 rounded-full border border-[#DCD9E3] text-[#5C218B] bg-white flex items-center justify-center hover:bg-[#FAF9FC] cursor-pointer"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    </div>

                    {showColorPicker === "shoe" && (
                      <div className="bg-[#FAF9FC] p-3 rounded-2xl border border-[#DCD9E3] flex flex-col gap-1.5 animate-fade-in">
                        <input
                          type="color"
                          value={avatar.shoeColor || "#ffffff"}
                          onChange={(e) => setAvatar({ ...avatar, shoeColor: e.target.value })}
                          className="w-full h-9 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: ACCESSORIES, EXPRESSIONS AND BACKGROUND STAGE */}
              {activeTab === "features" && (
                <div className="space-y-4">
                  
                  {/* Wearable Head / Body Accessories (30 types) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      👑 웨어러블 귀찌 및 악세서리 장식 (Accessory - 30종)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ACCESSORIES.map((item) => (
                        <button
                          key={item.id}
                          id={`accessory-pick-${item.id}`}
                          onClick={() => setAvatar({ ...avatar, accessory: item.id })}
                          className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-left cursor-pointer transition-all ${
                            avatar.accessory === item.id
                              ? "bg-[#5C218B] text-white border-transparent"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3D Situational Scenery Backgrounds (Studio lights removed, scenics added!) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C8894] font-black uppercase tracking-wider">
                      🗺️ 아바타 가상 거주 배경 (Situational Scenery - 8개소)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SITUATIONAL_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          id={`sandbox-bg-${bg.id}`}
                          onClick={() => setAvatar({ ...avatar, background: bg.id })}
                          className={`py-2.5 px-3 text-xs text-left font-bold rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            avatar.background === bg.id
                              ? "bg-gradient-to-r from-[#9B51E0] to-[#E051AE] text-white border-transparent shadow-xs"
                              : "border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC]"
                          }`}
                        >
                          <span>{bg.name}</span>
                          <span className="text-sm">{bg.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* FOOTER SECTION: 30 KAKAOTALK FRIENDLY KEY ACTION MOVEMENTS */}
          <div className="border-t border-[#DCD9E3] pt-3.5 mt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-[#8C8894] uppercase tracking-wider flex items-center gap-1">
                <span>🏃 카카오톡 메신저 모션 & 감정표현 (Action Move - 30종)</span>
              </label>
              <span className="text-[9px] font-bold text-[#9B51E0] bg-[#FAF9FC] px-1.5 py-0.5 rounded-md border border-[#DCD9E3]">
                실시간 꼬임 피규어 트리거
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1 bg-[#FAF9FC] p-2 rounded-2xl border border-[#DCD9E3] scrollbar-thin">
              {MOVEMENTS.map((anim) => (
                <button
                  key={anim.id}
                  id={`action-trigger-${anim.id}`}
                  onClick={() => setAvatar({ ...avatar, expression: anim.id })}
                  className={`py-2 px-2 text-[10px] font-bold rounded-xl text-center cursor-pointer transition-all border outline-none ${
                    avatar.expression === anim.id
                      ? "bg-[#5C218B] text-white border-transparent scale-[1.02] shadow-xs font-black"
                      : "border-[#DCD9E3] text-[#33323D] hover:bg-white"
                  }`}
                >
                  {anim.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* 3. APP FOOTER */}
      <footer className="w-full bg-white border-t border-[#E1DEE6] py-3 px-6 text-center text-xxs font-semibold text-[#8C8894] tracking-wider uppercase">
        PersonaGen Chibi Figure Sandbox Studio • 2026. Custom WebGL Model
      </footer>

      {showPhotoAnalyzer && (
        <PhotoAnalyzer
          userApiKey={userApiKey}
          setUserApiKey={setUserApiKey}
          onAnalyzeComplete={(patch) => setAvatar((prev) => ({ ...prev, ...patch }))}
          onClose={() => setShowPhotoAnalyzer(false)}
        />
      )}

    </div>
  );
}
