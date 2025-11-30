import {Moon, Sun, Laptop} from "lucide-react"
import {Button} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {useTheme} from "@/components/theme-provider"

export function ModeToggle() {
  const {setTheme, theme} = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-transparent border-slate-700">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
          <Moon
            className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
          <span className="sr-only">Téma váltása</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
        <DropdownMenuItem onClick={() => setTheme("light")}
                          className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
          <Sun className="mr-2 h-4 w-4"/>
          Világos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}
                          className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
          <Moon className="mr-2 h-4 w-4"/>
          Sötét
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}
                          className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
          <Laptop className="mr-2 h-4 w-4"/>
          Rendszer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}