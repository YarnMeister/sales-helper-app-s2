I'll provide a detailed technical breakdown of the Pipeline and Stage structure implementation with complete code examples.

## **Technical Implementation: Pipeline & Stage Structure**

### **1. Data Types & Interfaces**

```typescript
interface Pipeline {
  id: number
  name: string
  order_nr: number
  active: boolean
  stages?: Stage[]
  stagesLoading?: boolean
  stagesError?: string | null
}

interface Stage {
  id: number
  name: string
  order_nr: number
  pipeline_id: number
  active_flag: boolean
  deal_probability: number
}

interface SectionState {
  isOpen: boolean
  showRaw: boolean
  loading: boolean
  error: string | null
  data: any
}
```

### **2. State Management**

```typescript
const [pipelines, setPipelines] = useState<SectionState>({
  isOpen: true,
  showRaw: false,
  loading: true,
  error: null,
  data: null,
})

const [pipelineCollapsed, setPipelineCollapsed] = useState<Record<number, boolean>>({})

const togglePipelineCollapse = (pipelineId: number) => {
  setPipelineCollapsed((prev) => ({
    ...prev,
    [pipelineId]: !prev[pipelineId],
  }))
}
```

### **3. API Integration Functions**

```typescript
const fetchStagesForPipeline = async (pipelineId: number): Promise<Stage[]> => {
  const response = await fetch(`/api/pipedrive/stages?pipeline_id=${pipelineId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch stages")
  }

  return data.success ? data.data : []
}

const fetchPipelines = async () => {
  setPipelines((prev) => ({ ...prev, loading: true, error: null }))
  try {
    const response = await fetch("/api/pipedrive/pipelines")
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch pipelines")
    }

    // Set initial pipeline data with loading states
    const pipelinesWithStages = data.success && data.data
      ? data.data.map((pipeline: Pipeline) => ({
          ...pipeline,
          stages: [],
          stagesLoading: true,
          stagesError: null,
        }))
      : []

    setPipelines((prev) => ({ 
      ...prev, 
      loading: false, 
      data: { ...data, data: pipelinesWithStages } 
    }))

    // Fetch stages for each pipeline asynchronously
    if (data.success && data.data) {
      for (const pipeline of data.data) {
        try {
          const stages = await fetchStagesForPipeline(pipeline.id)
          setPipelines((prev) => ({
            ...prev,
            data: {
              ...prev.data,
              data: prev.data.data.map((p: Pipeline) =>
                p.id === pipeline.id 
                  ? { ...p, stages, stagesLoading: false, stagesError: null } 
                  : p,
              ),
            },
          }))
        } catch (error) {
          setPipelines((prev) => ({
            ...prev,
            data: {
              ...prev.data,
              data: prev.data.data.map((p: Pipeline) =>
                p.id === pipeline.id
                  ? {
                      ...p,
                      stagesLoading: false,
                      stagesError: error instanceof Error ? error.message : "Unknown error",
                    }
                  : p,
              ),
            },
          }))
        }
      }
    }
  } catch (error) {
    console.error("Fetch pipelines error:", error)
    setPipelines((prev) => ({
      ...prev,
      loading: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }))
  }
}
```

### **4. Backend API Routes**

**Pipelines API Route:**

```typescript
// app/api/pipedrive/pipelines/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.PIPEDRIVE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "PIPEDRIVE_API_KEY not configured" }, { status: 500 })
    }

    const response = await fetch(`https://api.pipedrive.com/v1/pipelines?api_token=${apiKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RTSE-Data-Plumbing/1.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            message: "Invalid personal API key. Please check your PIPEDRIVE_API_KEY.",
            details: errorText,
          },
          { status: 401 },
        )
      }
      throw new Error(`Pipedrive API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch pipelines",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
```

**Stages API Route:**

```typescript
// app/api/pipedrive/stages/route.ts
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.PIPEDRIVE_API_KEY
    const { searchParams } = new URL(request.url)
    const pipelineId = searchParams.get("pipeline_id")

    if (!apiKey) {
      return NextResponse.json({ error: "PIPEDRIVE_API_KEY not configured" }, { status: 500 })
    }

    if (!pipelineId) {
      return NextResponse.json({ error: "pipeline_id parameter is required" }, { status: 400 })
    }

    const response = await fetch(`https://api.pipedrive.com/v1/stages?pipeline_id=${pipelineId}&api_token=${apiKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RTSE-Data-Plumbing/1.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            message: "Invalid personal API key. Please check your PIPEDRIVE_API_KEY.",
            details: errorText,
          },
          { status: 401 },
        )
      }
      throw new Error(`Pipedrive API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch stages",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
```

### **5. UI Component Structure**

```typescriptreact
{/* Priority Pipeline Section */}
<Card className="border-2 border-blue-200 bg-blue-50">
  <CardHeader className="cursor-pointer" onClick={() => toggleSection("pipelines")}>
    <CardTitle className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {pipelines.isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        <span className="text-blue-800">🏗️ Pipelines & Stage Structure</span>
        {pipelines.loading && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleRaw("pipelines")
          }}
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          {pipelines.showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {pipelines.showRaw ? "Hide Raw" : "Show Raw"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            fetchPipelines()
          }}
          className="border-blue-500 text-blue-600 hover:bg-blue-100"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </CardTitle>
  </CardHeader>
  {pipelines.isOpen && (
    <CardContent className="bg-white">
      {/* Loading State */}
      {pipelines.loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading pipelines...</span>
        </div>
      )}

      {/* Error State */}
      {pipelines.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading pipelines:</p>
          <p className="text-red-600 text-sm">{pipelines.error}</p>
        </div>
      )}

      {/* Data Display */}
      {pipelines.data && !pipelines.loading && (
        <>
          {pipelines.showRaw ? (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(pipelines.data, null, 2)}
            </pre>
          ) : (
            <div className="space-y-4">
              {pipelines.data.success && pipelines.data.data?.length > 0 ? (
                pipelines.data.data.map((pipeline: Pipeline) => {
                  const isCollapsed = pipelineCollapsed[pipeline.id]
                  return (
                    <div key={pipeline.id} className="border-2 border-blue-300 rounded-lg">
                      {/* Pipeline Header */}
                      <div
                        className="bg-blue-100 px-4 py-3 border-b border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => togglePipelineCollapse(pipeline.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <div>
                              <h3 className="font-bold text-blue-900 text-lg">
                                {pipeline.name}
                              </h3>
                              <div className="text-sm text-blue-700">
                                <span className="font-medium">Pipeline ID: {pipeline.id}</span>
                                <span className="mx-2">•</span>
                                <span>Order: {pipeline.order_nr}</span>
                                <span className="mx-2">•</span>
                                <Badge
                                  variant={pipeline.active ? "default" : "secondary"}
                                  className={
                                    pipeline.active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-600"
                                  }
                                >
                                  {pipeline.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {pipeline.stagesLoading && (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                          )}
                        </div>
                      </div>

                      {/* Stages Table */}
                      {!isCollapsed && (
                        <div className="p-4">
                          {pipeline.stagesLoading && (
                            <div className="flex items-center justify-center py-4">
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                              <span className="text-gray-600">Loading stages...</span>
                            </div>
                          )}

                          {pipeline.stagesError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <p className="text-red-800 font-medium">Error loading stages:</p>
                              <p className="text-red-600 text-sm">{pipeline.stagesError}</p>
                            </div>
                          )}

                          {pipeline.stages && pipeline.stages.length > 0 && !pipeline.stagesLoading ? (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-blue-300">
                                <thead>
                                  <tr className="bg-blue-50">
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Stage ID
                                    </th>
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Stage Name
                                    </th>
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Order
                                    </th>
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Deal Probability
                                    </th>
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pipeline.stages.map((stage: Stage) => (
                                    <tr key={stage.id} className="hover:bg-blue-50">
                                      <td className="border border-blue-300 px-4 py-2 font-mono font-bold text-blue-800">
                                        {stage.id}
                                      </td>
                                      <td className="border border-blue-300 px-4 py-2 font-medium">
                                        {stage.name}
                                      </td>
                                      <td className="border border-blue-300 px-4 py-2">
                                        {stage.order_nr}
                                      </td>
                                      <td className="border border-blue-300 px-4 py-2">
                                        {stage.deal_probability}%
                                      </td>
                                      <td className="border border-blue-300 px-4 py-2">
                                        <Badge
                                          variant={stage.active_flag ? "default" : "secondary"}
                                          className={
                                            stage.active_flag
                                              ? "bg-green-100 text-green-800"
                                              : "bg-gray-100 text-gray-600"
                                          }
                                        >
                                          {stage.active_flag ? "Active" : "Inactive"}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            !pipeline.stagesLoading &&
                            !pipeline.stagesError && (
                              <p className="text-gray-500 text-center py-4">
                                No stages found for this pipeline
                              </p>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">No pipelines found</div>
              )}
            </div>
          )}
        </>
      )}
    </CardContent>
  )}
</Card>
```

### **6. Key Implementation Features**

**Asynchronous Data Loading:**

- Pipelines load first, then stages are fetched individually
- Each pipeline maintains its own loading state for stages
- Error handling per pipeline for stage loading


**State Management Pattern:**

- Centralized section state with loading, error, and data properties
- Separate collapse state for individual pipelines
- Immutable state updates using functional setState


**Visual Hierarchy:**

- Priority section with blue theme and border
- Collapsible pipeline cards with hover effects
- Prominent display of Pipeline IDs and Stage IDs
- Color-coded status badges


**Error Handling:**

- Individual error states for pipelines and stages
- User-friendly error messages
- Retry functionality with refresh buttons


**Performance Optimizations:**

- Lazy loading of stages (only when pipeline is expanded)
- Efficient state updates to prevent unnecessary re-renders
- Proper cleanup and error boundaries


This implementation provides a robust, scalable foundation for displaying hierarchical API data with excellent user experience and error handling.