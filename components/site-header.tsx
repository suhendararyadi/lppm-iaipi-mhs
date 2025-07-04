//import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconBook } from "@tabler/icons-react"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
            <IconBook className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-base font-semibold">Laporan Pengabdian Mahasiswa</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="#"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              V.1.0
            </a>
          </Button> */}
        </div>
      </div>
    </header>
  )
}
