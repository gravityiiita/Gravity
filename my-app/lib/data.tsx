import type { Wing, Event, Project, BlogPost,Member } from "./types";
import {
  CompetitiveCodingAnimation,
  WebDevelopmentAnimation,
  DesignAnimation,
  FossAnimation,
  AIAnimation,
} from "@/components/wing-animations";

export const wings: Wing[] = [
  {
    id: "1",
    name: "Competitive Coding",
    description: "Master algorithms and data structures through contests",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="60"
        height="60"
        viewBox="0 0 640 512"
      >
        <path
          fill="#fff"
          d="M64 96c0-35.3 28.7-64 64-64h384c35.3 0 64 28.7 64 64v256h-64V96H128v256H64zM0 403.2C0 392.6 8.6 384 19.2 384h601.6c10.6 0 19.2 8.6 19.2 19.2c0 42.4-34.4 76.8-76.8 76.8H76.8C34.4 480 0 445.6 0 403.2M281 209l-31 31l31 31c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-48-48c-9.4-9.4-9.4-24.6 0-33.9l48-48c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9zm112-34l48 48c9.4 9.4 9.4 24.6 0 33.9l-48 48c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l31-31l-31-31c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"
        />
      </svg>
    ),
    color: "from-blue-500 to-cyan-500",
    animationComponent: CompetitiveCodingAnimation,
  },
  {
    id: "2",
    name: "Web Development",
    description: "Build modern web applications with cutting-edge technologies",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 24 24"
      >
        <g fill="none" stroke="#fff" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            d="M20 10.128c0-3.832 0-5.747-1.172-6.938S15.771 2 12 2h-2C6.229 2 4.343 2 3.172 3.19S2 6.296 2 10.128s0 5.747 1.172 6.938c.47.477 1.054.763 1.828.934"
          />
          <path d="M22 17.5c0-1.875 0-2.812-.477-3.47a2.5 2.5 0 0 0-.553-.553C20.312 13 19.375 13 17.5 13h-5c-1.875 0-2.812 0-3.47.477a2.5 2.5 0 0 0-.553.553C8 14.689 8 15.626 8 17.5s0 2.812.477 3.47a2.5 2.5 0 0 0 .554.553C9.688 22 10.625 22 12.5 22h5c1.875 0 2.812 0 3.47-.477a2.5 2.5 0 0 0 .553-.553C22 20.312 22 19.375 22 17.5Z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.5 16l.92.793c.387.333.58.5.58.707s-.193.374-.58.707L16.5 19m-3-3l-.92.793c-.387.333-.58.5-.58.707s.193.374.58.707l.92.793M2.5 6h17"
          />
        </g>
      </svg>
    ),
    color: "from-green-500 to-emerald-500",
    animationComponent: WebDevelopmentAnimation,
  },
  {
    id: "5",
    name: "Private AI",
    description: "Explore privacy-preserving AI and machine learning",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="60"
        height="60"
        viewBox="0 0 24 24"
      >
        <g fill="none">
          <path
            fill="#fff"
            fillOpacity="0.16"
            d="M6.6 10h10.8c.88 0 1.6.72 1.6 1.6v7c0 1.32-1.08 2.4-2.4 2.4H7.4C6.08 21 5 19.92 5 18.6v-7c0-.88.72-1.6 1.6-1.6"
          />
          <path
            stroke="#fff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeWidth="1.2"
            d="M8 10V7c0-2.21 1.79-4 4-4s4 1.79 4 4v3m-9.4 0h10.8c.88 0 1.6.72 1.6 1.6v7c0 1.32-1.08 2.4-2.4 2.4H7.4C6.08 21 5 19.92 5 18.6v-7c0-.88.72-1.6 1.6-1.6m5.206 3.276l-.377 1.508a.2.2 0 0 1-.145.145l-1.508.377c-.202.05-.202.338 0 .388l1.508.377a.2.2 0 0 1 .145.145l.377 1.508c.05.202.338.202.388 0l.377-1.508a.2.2 0 0 1 .145-.145l1.508-.377c.202-.05.202-.338 0-.368l-1.508-.377a.2.2 0 0 1-.145-.145l-.377-1.508c-.05-.202-.338-.202-.388 0"
          />
        </g>
      </svg>
    ),
    color: "from-purple-500 to-violet-500",
    animationComponent: AIAnimation,
  },
  {
    id: "3",
    name: "Design",
    description: "Create stunning visual experiences and UI/UX designs",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="60"
        height="60"
        viewBox="0 0 32 32"
      >
        <path
          fill="#fff"
          d="M7.75 2.977a1 1 0 0 0-1.638-.747C4.393 3.657 3.35 4.837 2.744 5.94C2.12 7.077 2.001 8.064 2.001 9a4 4 0 0 0 8 0c0-1.28-.626-2.23-1.116-2.974l-.144-.22c-.52-.806-.962-1.59-.99-2.829m-5.749 14.03c0-1.116.088-2.528.584-3.696A5.48 5.48 0 0 0 6.001 14.5c1.292 0 2.48-.446 3.418-1.191c.495 1.17.582 2.582.582 3.697c0 1.844-.288 4.908-.815 7.523c-.263 1.303-.595 2.55-1.006 3.494c-.203.468-.45.919-.76 1.269c-.304.344-.777.708-1.416.708c-.64 0-1.113-.364-1.417-.708c-.309-.35-.556-.8-.76-1.269c-.411-.943-.745-2.19-1.008-3.494c-.528-2.614-.818-5.679-.818-7.523M10.986 6.68A7 7 0 0 1 20.929 12H17.5a4.5 4.5 0 0 0-4.5 4.5v3.43a7 7 0 0 1-1.613-.434a49 49 0 0 1-.209 2.053a9 9 0 0 0 1.822.396V24.5a4.5 4.5 0 0 0 4.5 4.5h8a4.5 4.5 0 0 0 4.5-4.5v-8a4.5 4.5 0 0 0-4.5-4.5h-2.555A9 9 0 0 0 9.973 4.95l.027.042l.136.205c.236.353.57.855.85 1.483M25.5 14a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5v-2.555A9.004 9.004 0 0 0 22.945 14zM15 19.93V16.5a2.5 2.5 0 0 1 2.5-2.5h3.43A7 7 0 0 1 15 19.93"
          strokeWidth="0.7"
          stroke="#fff"
        />
      </svg>
    ),
    color: "from-pink-500 to-rose-500",
    animationComponent: DesignAnimation,
  },
  {
    id: "4",
    name: "FOSS",
    description: "Contribute to open-source software and communities",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 2048 2048"
      >
        <path
          fill="#fff"
          d="M1792 704q0 58-19 110t-55 94t-83 71t-105 39q-11 57-39 105t-71 83t-94 54t-110 20H832q-32 0-61 10t-53 28t-42 43t-27 56q54 13 99 42t78 71t51 92t19 106q0 66-25 124t-69 102t-102 69t-124 25t-124-25t-102-68t-69-102t-25-125q0-57 19-109t53-93t81-71t103-40V633q-56-11-103-40t-81-70t-53-94t-19-109q0-66 25-124t68-101t102-69T576 0t124 25t101 69t69 102t26 124q0 57-19 109t-53 93t-81 71t-103 40v585q42-32 91-49t101-17h384q32 0 61-10t53-28t42-43t27-56q-54-13-99-42t-78-70t-51-92t-19-107q0-66 25-124t68-101t102-69t125-26t124 25t101 69t69 102t26 124M384 320q0 40 15 75t41 61t61 41t75 15t75-15t61-41t41-61t15-75t-15-75t-41-61t-61-41t-75-15t-75 15t-61 41t-41 61t-15 75m384 1408q0-40-15-75t-41-61t-61-41t-75-15t-75 15t-61 41t-41 61t-15 75t15 75t41 61t61 41t75 15t75-15t61-41t41-61t15-75m704-832q40 0 75-15t61-41t41-61t15-75t-15-75t-41-61t-61-41t-75-15t-75 15t-61 41t-41 61t-15 75t15 75t41 61t61 41t75 15"
          strokeWidth="51"
          stroke="#fff"
        />
      </svg>
    ),
    color: "from-yellow-500 to-orange-500",
    animationComponent: FossAnimation,
  }
];

export const defaultMembers: Member[] = [
  {
    id: "1",
    name: "Dr. Rajendra Singh",
    role: "coordinator",
    wing: "Overall",
    bio: "Faculty Advisor & Society Head",
    // Use absolute path so Next.js resolves the asset from /public correctly.
    // Relative "./public/..." caused requests like /admin/public/placeholder-avatar.svg (404) and repeated fetch attempts.
    image: "/placeholder-avatar.svg",
    isOverallCoordinator: true,
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "9",
    name: "Dr. Meera Nair",
    role: "coordinator",
    wing: "Overall",
    bio: "Faculty Coordinator",
    image: "/placeholder-avatar.svg",
    isFacultyCoordinator: true,
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "10",
    name: "Dr. Arvind Menon",
    role: "coordinator",
    wing: "Overall",
    bio: "Faculty Coordinator",
    image: "/placeholder-avatar.svg",
    isFacultyCoordinator: true,
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "2",
    name: "Aditya Sharma",
    role: "coordinator",
    wing: "Competitive Coding",
    bio: "Passionate about algorithms and problem-solving",
    // Missing asset; fallback to existing placeholder to stop repeated 404 fetch attempts.
    image: "/placeholder-avatar.svg",
    isOverallCoordinator: true,
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "3",
    name: "Priya Verma",
    role: "coordinator",
    wing: "Web Development",
    bio: "Full-stack developer with 3 years experience",
    image: "/placeholder-avatar.svg",
    isOverallCoordinator: true,
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "4",
    name: "Vikram Patel",
    role: "coordinator",
    wing: "Design",
    bio: "UI/UX designer and creative thinker",
    image: "/placeholder-avatar.svg",

    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "5",
    name: "Ananya Singh",
    role: "coordinator",
    wing: "Private AI",
    bio: "AI researcher and machine learning enthusiast",
    image: "/placeholder-avatar.svg",
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "6",
    name: "Rohit Kumar",
    role: "member",
    wing: "Competitive Coding",
    bio: "Enthusiastic coder",
    image: "/placeholder-avatar.svg",
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "7",
    name: "Sarah Chen",
    role: "member",
    wing: "Web Development",
    bio: "React specialist",
    image: "/placeholder-avatar.svg",
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "8",
    name: "Neha Gupta",
    role: "member",
    wing: "Design",
    bio: "Creative designer",
    image: "/placeholder-avatar.svg",
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
];

export const defaultEvents: Event[] = [
  {
    id: "1",
    title: "Coding Contest 2024",
    date: "2024-12-15",
    description: "Annual coding competition with exciting prizes",
    wing: "Competitive Coding",
    image: "/placeholder-avatar.svg",
  },
  {
    id: "2",
    title: "Web Dev Workshop",
    date: "2024-12-20",
    description: "Learn modern web development frameworks",
    wing: "Web Development",
    image: "/placeholder-avatar.svg",
  },
  {
    id: "3",
    title: "Design Bootcamp",
    date: "2024-12-25",
    description: "Intensive design thinking and prototyping",
    wing: "Design",
    image: "/placeholder-avatar.svg",
  },
  {
    id: "4",
    title: "Design Bootcamp",
    date: "2024-12-25",
    description: "Intensive design thinking and prototyping",
    wing: "Design",
    image: "/placeholder-avatar.svg",
  },
  {
    id: "5",
    title: "Design Bootcamp",
    date: "2024-12-25",
    description: "Intensive design thinking and prototyping",
    wing: "Design",
    image: "/placeholder-avatar.svg",
  },
];

export const defaultProjects: Project[] = [
  {
    id: "1",
    title: "CodeVerse Platform",
    description: "Online coding practice platform",
    wing: "Competitive Coding",
    technologies: ["React", "Node.js", "MongoDB"],
    link: "#",
    image: "/placeholder-avatar.svg",
  },
  {
    id: "2",
    title: "DesignHub",
    description: "Collaborative design tool",
    wing: "Design",
    technologies: ["Next.js", "Canvas API", "WebSocket"],
    link: "#",
    image: "/placeholder-avatar.svg",
  },
];

export const defaultBlogs: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with Competitive Programming",
    content:
      "A comprehensive guide to start your competitive programming journey...",
    author: "Aditya Sharma",
    date: "2024-12-01",
    category: "Competitive Coding",
    image: "/placeholder-avatar.svg",
    rollNumber: "2023001",
    mediumUrl: "https://medium.com/@aditya/competitive-programming-guide",
  },
];
