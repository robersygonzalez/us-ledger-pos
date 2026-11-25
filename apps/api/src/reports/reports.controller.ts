import { Controller, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportDateRangeDto } from "./dto/report-date-range.dto";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("financial-summary")
  getFinancialSummary(@Query() query: ReportDateRangeDto) {
    return this.reportsService.getFinancialSummary(query);
  }

  @Get("sales-tax")
  getSalesTaxReport(@Query() query: ReportDateRangeDto) {
    return this.reportsService.getSalesTaxReport(query);
  }

  @Get("low-stock-alerts")
  getLowStockAlerts() {
    return this.reportsService.getLowStockAlerts();
  }
}
