import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata = {
  title: "Gestor de Tareas",
  description: "Gestión de tareas y proyectos con ayuda de árboles binarios de búsqueda",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${grotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}